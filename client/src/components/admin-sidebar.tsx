import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
  BookOpen,
  Settings,
  BarChart3,
  PieChart,
  ChevronDown,
  Home,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/use-auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  children?: MenuItemProps[];
}

const MenuItem = ({
  icon,
  label,
  active,
  onClick,
  children,
}: MenuItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (children) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors",
            active && "bg-gray-700 text-white"
          )}
        >
          <div className="flex items-center space-x-3">
            {icon}
            <span className="font-medium">{label}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>
        {isExpanded && (
          <div className="ml-6 mt-2 space-y-1">
            {children.map((child, index) => (
              <MenuItem key={index} {...child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors",
        active && "bg-blue-600 text-white hover:bg-blue-700"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
};

export const AdminSidebar = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}: SidebarProps) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const menuItems: MenuItemProps[] = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      active: activeTab === "dashboard",
      onClick: () => onTabChange("dashboard"),
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Calendar",
      active: activeTab === "calendar",
      onClick: () => onTabChange("calendar"),
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: "Courts",
      active: activeTab === "schedules",
      onClick: () => onTabChange("schedules"),
    },
    // {
    //   icon: <MapPin className="h-5 w-5" />,
    //   label: "Courts",
    //   active: activeTab === "courts",
    //   onClick: () => onTabChange("courts"),
    // },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Bookings",
      active: activeTab === "bookings",
      onClick: () => onTabChange("bookings"),
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Users",
      active: activeTab === "users",
      onClick: () => onTabChange("users"),
    },
    // {
    //   icon: <DollarSign className="h-5 w-5" />,
    //   label: "Pricing",
    //   active: activeTab === "pricing",
    //   onClick: () => onTabChange("pricing"),
    // },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Analytics",
      active: activeTab === "analytics",
      onClick: () => onTabChange("analytics"),
      children: [
        {
          icon: <PieChart className="h-4 w-4" />,
          label: "Revenue",
          active: activeTab === "revenue",
          onClick: () => onTabChange("revenue"),
        },
        {
          icon: <BarChart3 className="h-4 w-4" />,
          label: "Bookings",
          active: activeTab === "booking-analytics",
          onClick: () => onTabChange("booking-analytics"),
        },
      ],
    },
    // {
    //   icon: <Settings className="h-5 w-5" />,
    //   label: "Settings",
    //   active: activeTab === "settings",
    //   onClick: () => onTabChange("settings"),
    // },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Username Banner at Top (replaces header) */}
          <div className="px-6 pt-6 pb-4">
            <div className="w-full bg-blue-600 rounded-lg p-3 flex flex-col items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user?.username?.toUpperCase()}
              </span>
              <span className="text-blue-100 text-xs mt-1">
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : ""}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => (
              <MenuItem key={index} {...item} />
            ))}
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-700">
            <div className="space-y-2">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to App
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
