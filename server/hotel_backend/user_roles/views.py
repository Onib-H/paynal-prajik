from django.contrib.auth import authenticate, logout, login
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from .models import CustomUsers
from .serializers import CustomUserSerializer
from .email.email import send_otp_to_email, send_reset_password
from django.core.cache import cache
from .validation.validation import RegistrationForm
from datetime import timedelta
from booking.models import Bookings
from booking.serializers import BookingSerializer
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from property.serializers import AreaSerializer

# Create your views here.
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auth_logout(request):
    try:
        logout(request)
        response = Response({'message': 'User logged out successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        
        return response
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    try:
        user = request.user
        
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_new_password = request.data.get('confirm_new_password')
        
        if not old_password or not new_password or not confirm_new_password:
            return Response({'error': 'Old password, new password, and confirm new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_new_password:
            return Response({'error': 'New password and confirm new password do not match'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def send_register_otp(request):
    try:     
        email = request.data.get("email")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")
        
        if not email or not password or not confirm_password:
            return Response({
                "error": {
                    "general": "Please fill out the fields"
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        form = RegistrationForm({
            'email': email,
            'password': password,
            'confirm_password': confirm_password
        })
        
        if not form.is_valid():
            return Response({
                "error": form.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if CustomUsers.objects.filter(email=email).exists():
            return Response({
                "error": {
                    "email": "Email already exists"
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        purpose = "account_verification"
        cache_key = f"{email}_{purpose}"
        
        if cache.get(cache_key):
            return Response({
                "error": {
                    "general": "An OTP has already been sent to your email. Please check your inbox."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message = "Your OTP for account verification"
        otp_generated = send_otp_to_email(email, message)
        
        if otp_generated is None:
            return Response({
                "error": {
                    "general": "An error occurred while sending the OTP. Please try again later."
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        OTP_EXPIRATION_TIME = 120
        cache.set(cache_key, otp_generated, OTP_EXPIRATION_TIME)
        
        return Response({
            "success": "OTP sent for account verification",
            'otp': otp_generated
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"{e}")
        return Response({
            "error": {
                "general": "An error occurred while sending the OTP. Please try again later."
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_otp(request):
    try:
        email = request.data.get("email")
        password = request.data.get("password")
        received_otp = request.data.get("otp")
        first_name = request.data.get("first_name", "Guest")
        last_name = request.data.get("last_name", "")
        
        if not email or not password or not received_otp:
            return Response({"error": "Email, password, and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

        purpose = "account_verification"
        cache_key = f"{email}_{purpose}"
        cached_otp = cache.get(cache_key)

        if cached_otp is None:
            return Response({"error": "OTP expired. Please request a new one."}, status=status.HTTP_404_NOT_FOUND)

        if str(cached_otp) != str(received_otp):
            return Response({"error": "Incorrect OTP code. Please try again"}, status=status.HTTP_400_BAD_REQUEST)
        
        cache.delete(cache_key)

        DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/ddjp3phzz/image/upload/v1741784007/wyzaupfxdvmwoogegsg8.jpg"
        
        if CustomUsers.objects.filter(email=email).exists():
            return Response({"error": "User already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = CustomUsers.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role="guest",
            profile_image=DEFAULT_PROFILE_IMAGE
        )
        user.save()

        user_auth = authenticate(request, username=email, password=password)
        if user_auth is not None:
            login(request, user_auth)
            refresh = RefreshToken.for_user(user_auth)
            response = Response({
                "message": "OTP verified and user registered successfully",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": CustomUserSerializer(user_auth).data
            }, status=status.HTTP_200_OK)
            # Set access and refresh token cookies.
            response.set_cookie(
                key="access_token",
                value=str(refresh.access_token),
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=timedelta(days=1)
            )
            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=timedelta(days=7)
            )
            return response
        else:
            return Response({
                "error": "An error occurred during authentication. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(f"OTP Error: {e}")
        return Response({
            "error": "An error occurred during registration. Please try again later."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def resend_otp(request):
    try:
        email = request.data.get("email")
        if not email:
            return Response({
                "error": "Email is required"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        purpose = "account_verification"
        cache_key = f"{email}_{purpose}"
        
        cached_otp = cache.get(cache_key)
        if cached_otp:
            otp_to_send = cached_otp
        else:
            otp_to_send = send_otp_to_email(email, "Your OTP for account verification")
            if otp_to_send is None:
                return Response({
                    "error": "An error occurred while resending the OTP. Please try again later."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            cache.set(cache_key, otp_to_send, timeout=120)
            
        return Response({
            "message": "OTP resent successfully",
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'An error occurred while resending the OTP. Please try again later. {e}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def forgot_password(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = CustomUsers.objects.filter(email=email).first()
        if not user:
            return Response({
                "error": "User does not exist"
            }, status=status.HTTP_404_NOT_FOUND)
        
        otp = send_reset_password(email)
        if otp is None:
            return Response({
                "error": "An error occurred while sending the OTP. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        purpose = "reset_password"
        cache_key = f"{email}_{purpose}"
        cache.set(cache_key, otp, timeout=120)
        
        return Response({
            "message": "OTP sent successfully",
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(str(e))
        return Response({
            'error': 'An error occurred while sending the OTP. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_reset_otp(request):
    try:
        email = request.data.get('email')
        received_otp = request.data.get('otp')
        
        if not email or not received_otp:
            return Response({
                "error": "Email and OTP are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        purpose = "reset_password"
        cache_key = f"{email}_{purpose}"
        cached_otp = cache.get(cache_key)
        
        if cached_otp is None:
            return Response({
                "error": "OTP expired. Please request a new one."
            }, status=status.HTTP_404_NOT_FOUND)
            
        if str(cached_otp) != str(received_otp):
            return Response({
                "error": "Incorrect OTP code. Please try again."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cache.delete(cache_key)
        
        return Response({
            "message": "OTP verified successfully"
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": "An error occurred while verifying the OTP. Please try again later."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def reset_password(request):
    try:
        email = request.data.get('email')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not email or not new_password or not confirm_password:
            return Response({
                "error": "Email, new password, and confirm password are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                "error": "New password and confirm password do not match"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = CustomUsers.objects.filter(email=email).first()
        
        if not user:
            return Response({
                "error": "User does not exist"
            }, status=status.HTTP_404_NOT_FOUND)
        
        existing_profile_image = user.profile_image
        
        user.set_password(new_password)
        user.profile_image = existing_profile_image
        user.save()
        
        user = authenticate(request, username=email, password=new_password)
        if user is not None:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            response = Response({
                "message": "Password reset successfully",
                'profile_image': user.profile_image.url if user.profile_image else "",
            }, status=status.HTTP_200_OK)
            
            response.set_cookie(
                key="access_token",
                value=str(refresh.access_token),
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=timedelta(days=1)
            )
            
            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=timedelta(days=7)
            )
            
            return response
        else:
            return Response({
                "error": "Password reset failed. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            "error": "An error occurred while resetting the password. Please try again later."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def user_login(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = CustomUsers.objects.filter(email=email)
        if not user:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)
            
        auth_user = authenticate(request, username=email, password=password)
        
        if auth_user is None:
            return Response({'error': 'Your password is incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = RefreshToken.for_user(auth_user)
        
        user_data = {
            'id': auth_user.id,
            'email': auth_user.email,
            'username': auth_user.username,
            'first_name': auth_user.first_name,
            'last_name': auth_user.last_name,
            'role': auth_user.role,
            'profile_image': auth_user.profile_image.url if auth_user.profile_image else "",
        }
        
        response = Response({
            'message': f'{auth_user.first_name} logged in successfully!',
            'user': user_data,
            'access_token': str(token.access_token),
            'refresh_token': str(token)
        }, status=status.HTTP_200_OK)
        
        response.set_cookie(
            key="access_token",
            value=str(token.access_token),
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=timedelta(days=1)
        )
        
        response.set_cookie(
            key="refresh_token",
            value=str(token),
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=timedelta(days=7)
        )
        
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_auth(request):
    try:
        user = request.user
        
        if not user.is_authenticated:
            return Response({
                'isAuthenticated': False,
                'error': 'User is not authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({
            'isAuthenticated': True,
            'role': user.role,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_image': user.profile_image.url if user.profile_image else "",
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'isAuthenticated': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_details(request, id):
    try:
        user = CustomUsers.objects.get(id=id)
        serializer = CustomUserSerializer(user)
        return Response({
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except CustomUsers.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_profile_picture(request):
    try:
        user = request.user
        if not user:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        user.profile_image = request.FILES['profile_image']
        user.save()
        
        return Response({
            'message': 'Profile picture updated successfully',
            'profile_image': user.profile_image.url
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_details(request, id):
    try:
        if request.user.id != id:
            return Response({
                'error': 'You are not authorized to update this profile'
            }, status=status.HTTP_403_FORBIDDEN)
            
        user = CustomUsers.objects.get(id=id)
        data = request.data.get('data', [])
        
        if len(data) >= 3:
            user.first_name = data[0]
            user.last_name = data[1]
            user.email = data[2]
            
            if user.email != user.username:
                user.username = user.email
                
            user.save()
            
            serializer = CustomUserSerializer(user)
            return Response({
                'message': 'Profile updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Insufficient data provided'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except CustomUsers.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_guest_bookings(request):
    try:        
        user = request.user
        bookings = Bookings.objects.filter(user=user).order_by('-created_at')
        
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 5)
        
        paginator = Paginator(bookings, page_size)
        
        try:
            paginated_bookings = paginator.page(page)
        except PageNotAnInteger:
            paginated_bookings = paginator.page(1)
        except EmptyPage:
            paginated_bookings = paginator.page(paginator.num_pages)
            
        booking_data = []
        for booking in paginated_bookings:
            booking_serializer = BookingSerializer(booking)
            data = booking_serializer.data
            
            if booking.is_venue_booking and booking.area:
                area_serializer = AreaSerializer(booking.area)
                data['area_details'] = area_serializer.data
            elif booking.room:
                from property.serializers import RoomSerializer
                room_serializer = RoomSerializer(booking.room)
                data['room_details'] = room_serializer.data
            
            if booking.valid_id:
                if hasattr(booking.valid_id, 'url'):
                    data['valid_id'] = booking.valid_id.url
                else:
                    data['valid_id'] = booking.valid_id
            
            booking_data.append(data)
        
        return Response({
            "data": booking_data,
            "pagination": {
                "total_pages": paginator.num_pages,
                "current_page": int(page),
                "total_items": paginator.count,
                "page_size": int(page_size)
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
