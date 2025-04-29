import { FC } from "react"
import { Outlet } from "react-router-dom"
import GuestSidebar from "./GuestSidebar"

const GuestLayout: FC = () => {

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex">
                <div className="w-68 sticky top-0 z-50">
                    <GuestSidebar />
                </div>
                <main className="flex-grow p-2 min-h-screen overflow-y-auto bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default GuestLayout