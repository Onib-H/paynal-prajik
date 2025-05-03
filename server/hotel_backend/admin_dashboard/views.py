from django.utils import timezone
from django.core.validators import ValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from property.models import Areas, Rooms, Amenities
from property.serializers import AreaSerializer, RoomSerializer, AmenitySerializer
from booking.models import Bookings, Reservations, Transactions
from booking.serializers import BookingSerializer
from user_roles.models import CustomUsers
from user_roles.serializers import CustomUserSerializer
from user_roles.views import create_booking_notification
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db.models import Q, Count, Sum
from datetime import datetime, date, timedelta
from .email.booking import send_booking_confirmation_email, send_booking_rejection_email

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_details(request):
    user = request.user
    
    if user.role != 'admin':
        return Response({"error": "Only admin users can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        admin_user = CustomUsers.objects.get(id=user.id, role='admin')
    
        data = {
            "name": admin_user.first_name + " " + admin_user.last_name,
            "role": admin_user.role,
            "profile_pic": admin_user.profile_image.url if admin_user.profile_image else None
        }
    
        return Response({
            'data': data
        }, status=status.HTTP_200_OK)
    except CustomUsers.DoesNotExist:
        return Response({"error": "Admin not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))
        
        start_date = timezone.datetime(year, month, 1)
        if month == 12:
            end_date = timezone.datetime(year + 1, 1, 1) - timezone.timedelta(days=1)
        else:
            end_date = timezone.datetime(year, month + 1, 1) - timezone.timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59)
        
        total_rooms = Rooms.objects.count()
        
        checked_in_room_ids = Bookings.objects.filter(
            Q(status='checked_in') & 
            Q(is_venue_booking=False) & 
            Q(check_in_date__lte=end_date.date()) &
            Q(check_out_date__gte=start_date.date())
        ).values_list('room_id', flat=True).distinct()
        
        available_rooms = Rooms.objects.filter(
            status='available'
        ).exclude(
            id__in=checked_in_room_ids
        ).count()
        
        occupied_rooms = Bookings.objects.filter(
            Q(status='checked_in') & 
            Q(is_venue_booking=False) & 
            Q(check_in_date__lte=end_date.date()) &
            Q(check_out_date__gte=start_date.date())
        ).count()
        
        maintenance_rooms = Rooms.objects.filter(status='maintenance').count()
        
        active_bookings = Bookings.objects.filter(
            Q(status__in=['confirmed', 'reserved', 'checked_in']) &
            Q(created_at__range=(start_date, end_date))
        ).count()
        
        pending_bookings = Bookings.objects.filter(
            Q(status='pending') &
            Q(created_at__range=(start_date, end_date))
        ).count()
        
        unpaid_bookings = Bookings.objects.filter(
            Q(payment_status='unpaid') &
            Q(created_at__range=(start_date, end_date))
        ).count()
        
        checked_in_count = Bookings.objects.filter(
            Q(status='checked_in') &
            Q(check_in_date__range=(start_date.date(), end_date.date()))
        ).count()
        
        total_bookings = Bookings.objects.filter(
            created_at__range=(start_date, end_date)
        ).count()
        
        upcoming_reservations = Bookings.objects.filter(
            Q(is_venue_booking=True) &
            Q(status__in=['confirmed', 'reserved']) &
            Q(check_in_date__gte=start_date.date())
        ).count()
        
        transactions_this_month = Transactions.objects.filter(
            transaction_date__range=(start_date, end_date),
            status='completed'
        )
        
        revenue = transactions_this_month.aggregate(Sum('amount'))['amount__sum'] or 0
        
        room_revenue = transactions_this_month.filter(
            Q(booking__isnull=False) & 
            Q(booking__is_venue_booking=False)
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        venue_revenue = transactions_this_month.filter(
            Q(booking__isnull=False) & 
            (Q(booking__is_venue_booking=True) | Q(reservation__isnull=False))
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        formatted_revenue = f"₱{revenue:,.2f}"
        formatted_room_revenue = f"₱{room_revenue:,.2f}"
        formatted_venue_revenue = f"₱{venue_revenue:,.2f}"
        
        response_data = {
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'occupied_rooms': occupied_rooms,
            'maintenance_rooms': maintenance_rooms,
            'active_bookings': active_bookings,
            'pending_bookings': pending_bookings,
            'unpaid_bookings': unpaid_bookings,
            'checked_in_count': checked_in_count,
            'total_bookings': total_bookings,
            'upcoming_reservations': upcoming_reservations,
            'revenue': revenue,
            'room_revenue': room_revenue,
            'venue_revenue': venue_revenue,
            'formatted_revenue': formatted_revenue,
            'formatted_room_revenue': formatted_room_revenue,
            'formatted_venue_revenue': formatted_venue_revenue,
            'month': month,
            'year': year
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def area_reservations(request):
    try:
        data = Reservations.objects.values('area').annotate(count=Count('area'))
        
        return Response({
            "data": data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Rooms
@api_view(['GET'])
def fetch_rooms(request):
    try:
        rooms = Rooms.objects.all().order_by('id')
        
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 9)
        paginator = Paginator(rooms, page_size)
        
        try:
            paginated_rooms = paginator.page(page)
        except PageNotAnInteger:
            paginated_rooms = paginator.page(1)
        except EmptyPage:
            paginated_rooms = paginator.page(paginator.num_pages)
        
        serializer = RoomSerializer(paginated_rooms, many=True)
        
        return Response({
            "data": serializer.data,
            "pagination": {
                "total_pages": paginator.num_pages,
                "current_page": int(page),
                "total_items": paginator.count,
                "page_size": int(page_size)
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_new_room(request):
    try:
        data = request.data.copy()
        if 'room_price' in data and isinstance(data['room_price'], str):
            try:
                price_str = data['room_price'].replace('₱', '').replace(',', '')
                data['room_price'] = float(price_str)
            except (ValueError, TypeError):
                pass
        
        if 'max_guests' in data and not isinstance(data['max_guests'], int):
            try:
                data['max_guests'] = int(data['max_guests'])
            except (ValueError, TypeError):
                data['max_guests'] = 2

        serializer = RoomSerializer(data=data)
        if serializer.is_valid():
            instance = serializer.save()
            data = RoomSerializer(instance).data
            return Response({
                "message": "Room added successfully",
                "data": data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "error": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def show_room_details(request, room_id):
    try:
        room = Rooms.objects.get(id=room_id)
        serializer = RoomSerializer(room)
        return Response({
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    except Rooms.DoesNotExist:
        return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_room(request, room_id):
    try:
        room = Rooms.objects.get(id=room_id)
    except Rooms.DoesNotExist:
        return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
    
    has_active_bookings = Bookings.objects.filter(
        room=room,
        status__in=['reserved', 'confirmed', 'checked_in']
    ).exists()
    
    if has_active_bookings:
        allowed_fields = ['description', 'amenities', 'status', 'max_guests']
        filtered_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        if 'status' in filtered_data and filtered_data['status'] == 'unavailable':
            return Response({
                "error": "Cannot change status to unavailable when there are active or reserved bookings",
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if 'max_guests' in filtered_data and not isinstance(filtered_data['max_guests'], int):
            try:
                filtered_data['max_guests'] = int(filtered_data['max_guests'])
            except (ValueError, TypeError):
                filtered_data['max_guests'] = 2
        
        serializer = RoomSerializer(room, data=filtered_data, partial=True)
    else:
        data = request.data.copy()
        if 'room_price' in data and isinstance(data['room_price'], str):
            try:
                price_str = data['room_price'].replace('₱', '').replace(',', '')
                data['room_price'] = float(price_str)
            except (ValueError, TypeError):
                pass 
        
        if 'max_guests' in data and not isinstance(data['max_guests'], int):
            try:
                data['max_guests'] = int(data['max_guests'])
            except (ValueError, TypeError):
                data['max_guests'] = 2
        
        serializer = RoomSerializer(room, data=data, partial=True)
    
    if serializer.is_valid():
        instance = serializer.save()
        return Response({
            "message": "Room updated successfully",
            "data": RoomSerializer(instance).data
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_room(request, room_id):
    try:
        room = Rooms.objects.get(id=room_id)        
        active_bookings = Bookings.objects.filter(
            room=room,
            status__in=['reserved', 'confirmed', 'checked_in']
        ).exists()
        
        if active_bookings:
            return Response({
                "error": "Cannot delete room with active or reserved bookings",
                "message": "This room has active or reserved bookings and cannot be deleted."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        room.delete()
        return Response({
            "message": "Room deleted successfully"
        }, status=status.HTTP_200_OK)
    except Rooms.DoesNotExist:
        return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Areas
@api_view(['GET'])
def fetch_areas(request):
    try:
        areas = Areas.objects.all().order_by('id')
        
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 9)
        paginator = Paginator(areas, page_size)

        try:
            paginated_areas = paginator.page(page)
        except PageNotAnInteger:
            paginated_areas = paginator.page(1)
        except EmptyPage:
            paginated_areas = paginator.page(paginator.num_pages)
        
        serializer = AreaSerializer(paginated_areas, many=True)
        
        return Response({
            "data": serializer.data,
            "pagination": {
                "total_pages": paginator.num_pages,
                "current_page": int(page),
                "total_items": paginator.count,
                "page_size": int(page_size)
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_new_area(request):
    try:
        data = request.data.copy()
        if 'price_per_hour' in data and isinstance(data['price_per_hour'], str):
            try:
                price_str = data['price_per_hour'].replace('₱', '').replace(',', '')
                data['price_per_hour'] = float(price_str)
            except (ValueError, TypeError):
                pass 
        
        serializer = AreaSerializer(data=data)
        if serializer.is_valid():
            instance = serializer.save()
            return Response({
                "message": "Area added successfully",
                "data": AreaSerializer(instance).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "error": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def show_area_details(request, area_id):
    try:
        area = Areas.objects.get(id=area_id)
        serializer = AreaSerializer(area)
        return Response({
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    except Areas.DoesNotExist:
        return Response({
            "error": "Area not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_area(request, area_id):
    try:
        area = Areas.objects.get(id=area_id)
    except Areas.DoesNotExist:
        return Response({"error": "Area not found"}, status=status.HTTP_404_NOT_FOUND)
    
    has_active_reservations = Reservations.objects.filter(
        area=area,
        start_time__gte=timezone.now()
    ).exists()
    
    if has_active_reservations:
        allowed_fields = ['description', 'status']
        filtered_data = {k: v for k, v in request.data.items() if k in allowed_fields}    
        
        if 'status' in filtered_data and filtered_data['status'] == 'maintenance':
            return Response({
                "error": "Cannot change status to maintenance when there are upcoming reservations",
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AreaSerializer(area, data=filtered_data, partial=True)
    else:
        data = request.data.copy()
        if 'price_per_hour' in data and isinstance(data['price_per_hour'], str):
            try:
                price_str = data['price_per_hour'].replace('₱', '').replace(',', '')
                data['price_per_hour'] = float(price_str)
            except (ValueError, TypeError):
                pass 
                
        serializer = AreaSerializer(area, data=data, partial=True)
    
    if serializer.is_valid():
        instance = serializer.save()
        return Response({
            "message": "Area updated successfully",
            "data": AreaSerializer(instance).data
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_area(request, area_id):
    try:
        area = Areas.objects.get(id=area_id)
        
        active_bookings = Bookings.objects.filter(
            area=area,
            status__in=['reserved', 'confirmed', 'checked_in']
        ).exists()
        
        if active_bookings:
            return Response({
                "error": "Cannot delete area with active or reserved bookings",
                "message": "This area has active or reserved bookings and cannot be deleted."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        area.delete()
        return Response({
            "message": "Area deleted successfully"
        }, status=status.HTTP_200_OK)
    except Areas.DoesNotExist:
        return Response({
            "error": "Area not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# CRUD Amenities
@api_view(['GET'])
def fetch_amenities(request):
    try:
        amenities = Amenities.objects.all().order_by('id')
        page = request.query_params.get('page')
        page_size = request.query_params.get('page_size')
        
        paginator = Paginator(amenities, page_size)
        try:
            amenities_page = paginator.page(page)
        except PageNotAnInteger:
            amenities_page = paginator.page(1)
        except EmptyPage:
            amenities_page = paginator.page(paginator.num_pages)
        serializer = AmenitySerializer(amenities_page, many=True)
        return Response({
            "data": serializer.data,
            "page": amenities_page.number,
            "pages": paginator.num_pages,
            "total": paginator.count
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_amenity(request):
    try:
        serializer = AmenitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Amenity added successfully"
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "error": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except ValidationError as ve:
        return Response({
            "error": str(ve)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retreive_amenity(request, pk):
    try:
        amenity = Amenities.objects.get(pk=pk)
        serializer = AmenitySerializer(amenity)
        return Response({
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    except Amenities.DoesNotExist:
        return Response({
            "error": "Amenity not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_amenity(request, pk):
    try:
        amenity = Amenities.objects.get(pk=pk)
    except Amenities.DoesNotExist:
        return Response({
            "error": "Amenity not found"
        }, status=status.HTTP_404_NOT_FOUND)
    try:
        serializer = AmenitySerializer(amenity, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Amenity updated successfully"
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "error": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except ValidationError as ve:
        return Response({
            "error": str(ve)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_amenity(request, pk):
    try:
        amenity = Amenities.objects.get(pk=pk)
        amenity.delete()
        return Response({
            "message": "Amenity deleted successfully"
        }, status=status.HTTP_200_OK)
    except Amenities.DoesNotExist:
        return Response({
            "error": "Amenity not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bookings(request):
    try:
        exclude_statuses = [
            'cancelled',
            'rejected',
            'no_show',
            'checked_out'
        ]
        
        bookings = Bookings.objects.filter(
            ~Q(status__in=exclude_statuses)
        ).order_by('-created_at')
        
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 9)
        
        paginator = Paginator(bookings, page_size)
        
        try:
            paginated_bookings = paginator.page(page)
        except PageNotAnInteger:
            paginated_bookings = paginator.page(1)
        except EmptyPage:
            paginated_bookings = paginator.page(paginator.num_pages)

        serializer = BookingSerializer(paginated_bookings, many=True)
        
        return Response({
            "data": serializer.data,
            "pagination": {
                "total_pages": paginator.num_pages,
                "current_page": int(page),
                "total_items": paginator.count,
                "page_size": int(page_size)
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_detail(request, booking_id):
    try:
        booking = Bookings.objects.get(id=booking_id)
        booking_serializer = BookingSerializer(booking)
        data = booking_serializer.data
        
        room_serializer = RoomSerializer(booking.room)
        data['room'] = room_serializer.data
        
        return Response({
            "data": data
        }, status=status.HTTP_200_OK)
    except Bookings.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):
    try:
        booking = Bookings.objects.get(id=booking_id)
    except Bookings.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    
    status_value = request.data.get('status')
    if not status_value:
            return Response({"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    valid_statuses = ['pending', 'reserved', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'rejected', 'no_show']
    if status_value not in valid_statuses:
        return Response({"error": f"Invalid status value. Valid values are: {', '.join(valid_statuses)}"}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
    set_available = request.data.get('set_available')
    prevent_maintenance = set_available is False

    if status_value in ['reserved', 'confirmed', 'checked_in'] and not prevent_maintenance:
        if booking.is_venue_booking and booking.area:
            area = booking.area
            area.status = 'maintenance'
            area.save()
        elif booking.room:
            room = booking.room
            room.status = 'maintenance'
            room.save()
    elif status_value not in ['reserved', 'confirmed', 'checked_in']:
        if booking.is_venue_booking and booking.area:
            area = booking.area
            area.status = 'available'
            area.save()
        elif booking.room:
            room = booking.room
            room.status = 'available'
            room.save()
    
    if set_available:
        if booking.is_venue_booking and booking.area:
            area = booking.area
            area.status = 'available'
            area.save()
        elif booking.room:
            room = booking.room
            room.status = 'available'
            room.save()
    
    if status_value == 'rejected':
        booking.cancellation_date = timezone.now()
        booking.cancellation_reason = request.data.get('reason', 'Rejected by admin/staff')
    
    previous_status = booking.status
    booking.status = status_value
    booking.save()
    
    serializer = BookingSerializer(booking)
    
    property_name = ""

    try:
        if booking.is_venue_booking and booking.area:
            property_name = booking.area.area_name
        elif booking.room:
            property_name = booking.room.room_name
        else:
            property_name = "your reservation"
    except Exception as e:
        property_name = "your reservation"
    
    booking.property_name = property_name
    
    if status_value != previous_status:
        try:
            create_booking_notification(booking, status_value)
            if status_value == 'reserved':
                user_email = booking.user.email
                send_booking_confirmation_email(user_email, serializer.data)
            elif status_value == 'rejected':
                user_email = booking.user.email
                send_booking_rejection_email(user_email, serializer.data)
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    if booking.status not in ['reserved', 'checked_in'] and (status_value == 'cancelled' or status_value == 'rejected'):
        if booking.is_venue_booking and booking.area:
            area = booking.area
            area.status = 'available'
            area.save()
        elif booking.room:
            room = booking.room
            room.status = 'available'
            room.save()
    
    return Response({
        "message": f"Booking status updated to {status_value}",
        "data": serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_payment(request, booking_id):
    try:
        booking = Bookings.objects.get(id=booking_id)
    except Bookings.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    
    amount = request.data.get('amount')
    transaction_type = request.data.get('transaction_type', 'booking')
    
    if not amount:
        return Response({"error": "Payment amount is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if isinstance(amount, str):
            amount = float(amount)
            
        booking.payment_status = 'paid'
        booking.save()
        
        transaction = Transactions.objects.create(
            booking=booking,
            user=booking.user,
            transaction_type=transaction_type,
            amount=amount,
            status='completed'
        )
        
        return Response({
            "message": "Payment recorded successfully",
            "transaction_id": transaction.id,
            "booking_id": booking.id,
            "amount": amount
        }, status=status.HTTP_201_CREATED)
        
    except ValueError:
        return Response({"error": "Invalid payment amount"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_status_counts(request):
    try:
        pending_count = Bookings.objects.filter(status='pending').count()
        reserved_count = Bookings.objects.filter(status='reserved').count()
        checked_in_count = Bookings.objects.filter(status='checked_in').count()
        checked_out_count = Bookings.objects.filter(status='checked_out').count()
        cancelled_count = Bookings.objects.filter(status='cancelled').count()
        no_show_count = Bookings.objects.filter(status='no_show').count() 
        rejected_count = Bookings.objects.filter(status='rejected').count()
        
        return Response({
            "pending": pending_count,
            "reserved": reserved_count,
            "checked_in": checked_in_count,
            "checked_out": checked_out_count,
            "cancelled": cancelled_count,
            "no_show": no_show_count,
            "rejected": rejected_count
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# CRUD Users
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_all_users(request):
    try:
        users = CustomUsers.objects.filter(role="guest")
        serializer = CustomUserSerializer(users, many=True)
        return Response({
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def show_user_details(request, user_id):
    try:
        user = CustomUsers.objects.get(id=user_id, is_staff=False, is_superuser=False)
        serializer = CustomUserSerializer(user)
        return Response({
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    except CustomUsers.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def manage_user(request, user_id):
    if request.method == 'PUT':
        try:
            if user_id == 0:
                data = request.POST
                files = request.FILES
                
                email = data.get('email')
                password = data.get('password')
                first_name = data.get('first_name')
                last_name = data.get('last_name')
                role = data.get('role', 'guest')
                
                if not email or not password:
                    return Response({
                        'error': 'Email and password are required'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                if CustomUsers.objects.filter(email=email).exists():
                    return Response({
                        'error': 'Email already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                user = CustomUsers.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    role=role
                )
                
                return Response({
                    'message': 'User created successfully',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role
                    }
                })
            else:
                try:
                    user = CustomUsers.objects.get(id=user_id)
                except CustomUsers.DoesNotExist:
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
                
                data = request.POST
                files = request.FILES
                
                new_email = data.get('email')
                if new_email and new_email != user.email:
                    if CustomUsers.objects.filter(email=new_email).exists():
                        return Response({
                            'error': 'Email already exists'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    user.email = new_email
                
                if data.get('first_name'):
                    user.first_name = data.get('first_name')
                
                if data.get('last_name'):
                    user.last_name = data.get('last_name')
                    
                if data.get('role'):
                    user.role = data.get('role')
                
                password = data.get('password')
                if password:
                    user.set_password(password)
                
                try:
                    user.save()
                    return Response({
                        'message': 'User updated successfully',
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'role': user.role
                        }
                    })
                except ValidationError as e:
                    return Response({'error': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({'error': 'Invalid request method'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def archive_user(request, user_id):
    try:
        users = CustomUsers.objects.get(id=user_id)
        users.delete()
        return Response({'message': 'User archived successfully'}, status=status.HTTP_200_OK)
    except CustomUsers.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_revenue(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))
        
        start_date = datetime(year, month, 1)
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59)        
        days_in_month = (end_date.day)
        daily_revenue = [0] * days_in_month
        
        transactions = Transactions.objects.filter(
            transaction_date__gte=start_date,
            transaction_date__lte=end_date,
            status='completed'
        )
        
        for transaction in transactions:
            day_idx = transaction.transaction_date.day - 1
            daily_revenue[day_idx] += float(transaction.amount)
        
        return Response({
            "data": daily_revenue,
            "month": month,
            "year": year,
            "days_in_month": days_in_month
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_bookings(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))
        
        start_date = datetime(year, month, 1)
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59)        
        days_in_month = (end_date.day)        
        daily_bookings = [0] * days_in_month
        
        bookings = Bookings.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        for booking in bookings:
            day_idx = booking.created_at.day - 1
            daily_bookings[day_idx] += 1
        
        return Response({
            "data": daily_bookings,
            "month": month,
            "year": year,
            "days_in_month": days_in_month
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_occupancy(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))        
        start_date = datetime(year, month, 1).date()
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
        
        days_in_month = (end_date.day)        
        daily_occupancy = [0] * days_in_month
        
        total_rooms = Rooms.objects.count()
        if total_rooms == 0:
            return Response({
                "data": daily_occupancy,
                "month": month,
                "year": year,
                "days_in_month": days_in_month
            }, status=status.HTTP_200_OK)
        
        for day in range(1, days_in_month + 1):
            current_date = date(year, month, day)
            
            occupied_rooms = Bookings.objects.filter(
                Q(check_in_date__lte=current_date) & 
                Q(check_out_date__gte=current_date) &
                Q(status__in=['reserved', 'confirmed', 'checked_in']) &
                Q(is_venue_booking=False)
            ).count()
            
            occupancy_rate = (occupied_rooms / total_rooms) * 100
            daily_occupancy[day - 1] = round(occupancy_rate, 2)
        
        return Response({
            "data": daily_occupancy,
            "month": month,
            "year": year,
            "days_in_month": days_in_month
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_checkins_checkouts(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))
        start_date = datetime(year, month, 1)
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59)
        
        days_in_month = (end_date.day)
        daily_checkins = [0] * days_in_month
        daily_checkouts = [0] * days_in_month
        
        bookings = Bookings.objects.all()
        
        for booking in bookings:
            if booking.check_in_date and booking.check_in_date.month == month and booking.check_in_date.year == year:
                if booking.status == 'checked_in' or booking.status == 'checked_out':
                    day_idx = booking.check_in_date.day - 1
                    if 0 <= day_idx < days_in_month:
                        daily_checkins[day_idx] += 1
            
            if booking.check_out_date and booking.check_out_date.month == month and booking.check_out_date.year == year:
                if booking.status == 'checked_out':
                    day_idx = booking.check_out_date.day - 1
                    if 0 <= day_idx < days_in_month:
                        daily_checkouts[day_idx] += 1
        
        return Response({
            "checkins": daily_checkins,
            "checkouts": daily_checkouts,
            "month": month,
            "year": year,
            "days_in_month": days_in_month
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_cancellations(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))       
        start_date = datetime(year, month, 1)
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59)
        days_in_month = (end_date.day)
        daily_cancellations = [0] * days_in_month        
        cancelled_bookings = Bookings.objects.filter(
            status='cancelled',
            cancellation_date__gte=start_date,
            cancellation_date__lte=end_date
        )
        
        for booking in cancelled_bookings:
            day_idx = booking.cancellation_date.day - 1
            daily_cancellations[day_idx] += 1
        
        return Response({
            "data": daily_cancellations,
            "month": month,
            "year": year,
            "days_in_month": days_in_month
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def room_revenue(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))        
        start_date = datetime(year, month, 1)
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)

        end_date = end_date.replace(hour=23, minute=59, second=59)
        
        response_data = {
            "room_names": [],
            "revenue_data": [],
            "month": month,
            "year": year
        }
        
        rooms = Rooms.objects.all()
        
        for room in rooms:
            room_revenue = Transactions.objects.filter(
                booking__room=room,
                transaction_date__gte=start_date,
                transaction_date__lte=end_date,
                status='completed',
                booking__is_venue_booking=False
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            response_data["room_names"].append(room.room_name)
            response_data["revenue_data"].append(float(room_revenue))
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def room_bookings(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))        
        start_date = datetime(year, month, 1)
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59)
        
        response_data = {
            "room_names": [],
            "booking_counts": [],
            "month": month,
            "year": year
        }
        
        rooms = Rooms.objects.all()
        
        for room in rooms:
            room_bookings = Bookings.objects.filter(
                room=room,
                created_at__gte=start_date,
                created_at__lte=end_date,
                is_venue_booking=False
            ).count()
            
            response_data["room_names"].append(room.room_name)
            response_data["booking_counts"].append(room_bookings)
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_no_shows_rejected(request):
    try:
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))        
        start_date = datetime(year, month, 1)
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        end_date = end_date.replace(hour=23, minute=59, second=59)        
        days_in_month = (end_date.day)
        
        daily_no_shows = [0] * days_in_month
        daily_rejected = [0] * days_in_month
        
        no_show_bookings = Bookings.objects.filter(
            status='missed_reservation',
            updated_at__gte=start_date,
            updated_at__lte=end_date
        )
        
        rejected_bookings = Bookings.objects.filter(
            status='rejected',
            updated_at__gte=start_date,
            updated_at__lte=end_date
        )
        
        for booking in no_show_bookings:
            day_idx = booking.updated_at.day - 1
            daily_no_shows[day_idx] += 1
        
        for booking in rejected_bookings:
            day_idx = booking.updated_at.day - 1
            daily_rejected[day_idx] += 1
        
        return Response({
            "no_shows": daily_no_shows,
            "rejected": daily_rejected,
            "month": month,
            "year": year,
            "days_in_month": days_in_month
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)