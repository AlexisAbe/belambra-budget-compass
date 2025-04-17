
import React from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Users, Campaign } from "lucide-react";

const MainNav = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-4 w-[400px]">
              <Link to="/clients" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md">
                <Users className="w-5 h-5" />
                <div>
                  <div className="font-medium">Clients</div>
                  <p className="text-sm text-gray-500">Gérer les clients</p>
                </div>
              </Link>
              <Link to="/campaigns" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md">
                <Campaign className="w-5 h-5" />
                <div>
                  <div className="font-medium">Campagnes</div>
                  <p className="text-sm text-gray-500">Gérer les campagnes marketing</p>
                </div>
              </Link>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MainNav;
