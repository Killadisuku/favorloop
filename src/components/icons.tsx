import {
  Bell,
  Bookmark,
  Compass,
  Flag,
  Home,
  Infinity,
  LocateFixed,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Shield,
  Trophy,
  User,
  Wallet,
} from "lucide-react";

export const IconLoop = ({ size = 18 }: { size?: number }) => <Infinity size={size} strokeWidth={2.2} />;
export const IconHome = ({ size = 18 }: { size?: number }) => <Home size={size} />;
export const IconCompass = ({ size = 18 }: { size?: number }) => <Compass size={size} />;
export const IconPlus = ({ size = 18 }: { size?: number }) => <Plus size={size} />;
export const IconBell = ({ size = 18 }: { size?: number }) => <Bell size={size} />;
export const IconUser = ({ size = 18 }: { size?: number }) => <User size={size} />;
export const IconWallet = ({ size = 18 }: { size?: number }) => <Wallet size={size} />;
export const IconChat = ({ size = 18 }: { size?: number }) => <MessageCircle size={size} />;
export const IconShield = ({ size = 18 }: { size?: number }) => <Shield size={size} />;
export const IconFlag = ({ size = 18 }: { size?: number }) => <Flag size={size} />;
export const IconTrophy = ({ size = 18 }: { size?: number }) => <Trophy size={size} />;
export const IconSearch = ({ size = 18 }: { size?: number }) => <Search size={size} />;
export const IconBookmark = ({ size = 18 }: { size?: number }) => <Bookmark size={size} />;
export const IconLocate = ({ size = 18 }: { size?: number }) => <LocateFixed size={size} />;
export const IconPin = ({ size = 18 }: { size?: number }) => <MapPin size={size} />;
