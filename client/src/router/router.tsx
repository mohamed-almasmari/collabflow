import {createBrowserRouter, Navigate } from "react-router";

import AppLayout from "../components/layout/AppLayout.tsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.tsx";
import LoginPage from "../pages/Login/LoginPage.tsx";
import RegisterPage from "../pages/Register/RegisterPage.tsx";

export const router = createBrowserRouter([
    {
        path:"/",
        element:<Navigate to="/login" replace />,
    },
    {
        path:"/login",
        element:<LoginPage/>,
    },
    {
        path:"/register",
        element:<RegisterPage/>,
    },
    {
        element:<AppLayout/>,
        children:[
            {
                path:"/dashboard",
                element:<DashboardPage/>,
            }
        ]
    }

])