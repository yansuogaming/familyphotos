"use client";

// App icon set: Morphicons (animated morphing) drawing Lucide's stroke icons.
// Names mirror the previous set so call sites read the same; an icon whose
// `icon` prop changes morphs into the new shape (see <Morph>).
import { MorphIcon, type MorphIconProps } from "morphicons/react";
import {
  AppWindow as LAppWindow,
  ArrowDown as LArrowDown,
  ArrowLeft as LArrowLeft,
  ArrowLeftRight as LArrowLeftRight,
  ArrowRight as LArrowRight,
  ArrowUp as LArrowUp,
  AudioLines as LAudioLines,
  Ban as LBan,
  Bell as LBell,
  BellOff as LBellOff,
  BookOpen as LBookOpen,
  BookOpenText as LBookOpenText,
  Bookmark as LBookmark,
  Calculator as LCalculator,
  Camera as LCamera,
  Check as LCheck,
  ChevronDown as LChevronDown,
  ChevronLeft as LChevronLeft,
  ChevronRight as LChevronRight,
  ChevronUp as LChevronUp,
  ChevronsUpDown as LChevronsUpDown,
  CircleAlert as LCircleAlert,
  CircleCheck as LCircleCheck,
  CircleX as LCircleX,
  Clock as LClock,
  CloudUpload as LCloudUpload,
  Copy as LCopy,
  Delete as LDelete,
  Download as LDownload,
  Ellipsis as LEllipsis,
  EllipsisVertical as LEllipsisVertical,
  ExternalLink as LExternalLink,
  Eye as LEye,
  EyeOff as LEyeOff,
  FileDown as LFileDown,
  FileText as LFileText,
  Flame as LFlame,
  Folder as LFolder,
  FolderPlus as LFolderPlus,
  GripVertical as LGripVertical,
  Hand as LHand,
  Heart as LHeart,
  History as LHistory,
  House as LHouse,
  HouseHeart as LHouseHeart,
  Image as LImage,
  Images as LImages,
  Info as LInfo,
  KeyRound as LKeyRound,
  Library as LLibrary,
  Lightbulb as LLightbulb,
  List as LList,
  ListMinus as LListMinus,
  ListOrdered as LListOrdered,
  Lock as LLock,
  LockKeyhole as LLockKeyhole,
  LockOpen as LLockOpen,
  LogOut as LLogOut,
  Mail as LMail,
  MapPin as LMapPin,
  Maximize2 as LMaximize2,
  Menu as LMenu,
  MessageCircle as LMessageCircle,
  MessageCircleMore as LMessageCircleMore,
  MessageSquareText as LMessageSquareText,
  MessagesSquare as LMessagesSquare,
  Mic as LMic,
  MicOff as LMicOff,
  Minimize2 as LMinimize2,
  Minus as LMinus,
  Monitor as LMonitor,
  Moon as LMoon,
  PanelLeft as LPanelLeft,
  Paperclip as LPaperclip,
  PartyPopper as LPartyPopper,
  Pause as LPause,
  PawPrint as LPawPrint,
  Pencil as LPencil,
  PencilLine as LPencilLine,
  Phone as LPhone,
  PhoneOff as LPhoneOff,
  Pin as LPin,
  Play as LPlay,
  Plug as LPlug,
  Plus as LPlus,
  QrCode as LQrCode,
  Reply as LReply,
  RotateCcw as LRotateCcw,
  RotateCw as LRotateCw,
  ScanQrCode as LScanQrCode,
  Search as LSearch,
  Send as LSend,
  SendHorizontal as LSendHorizontal,
  Settings as LSettings,
  Share2 as LShare2,
  ShieldAlert as LShieldAlert,
  ShieldCheck as LShieldCheck,
  ShieldUser as LShieldUser,
  SkipForward as LSkipForward,
  Smartphone as LSmartphone,
  Smile as LSmile,
  Sparkles as LSparkles,
  SquareCheck as LSquareCheck,
  SquareFunction as LSquareFunction,
  SquarePen as LSquarePen,
  Sun as LSun,
  SwitchCamera as LSwitchCamera,
  Tablet as LTablet,
  TextAlignStart as LTextAlignStart,
  Ticket as LTicket,
  Trash2 as LTrash2,
  TriangleAlert as LTriangleAlert,
  Unlink as LUnlink,
  Upload as LUpload,
  UserCog as LUserCog,
  UserPlus as LUserPlus,
  Users as LUsers,
  Utensils as LUtensils,
  Video as LVideo,
  VideoOff as LVideoOff,
  X as LX,
  ZoomIn as LZoomIn,
  ZoomOut as LZoomOut,
} from "lucide";
import type { ComponentType } from "react";

export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

export interface IconProps extends Omit<MorphIconProps, "icon" | "from" | "to" | "progress" | "spring" | "label"> {
  /** Stroke icons have no filled variant: weight maps to stroke width. */
  weight?: IconWeight;
}

export type Icon = ComponentType<IconProps>;

const STROKE: Record<IconWeight, number> = { thin: 1.25, light: 1.5, regular: 1.75, duotone: 1.75, fill: 2.25, bold: 2.5 };

/** Raw icon data, for morphing between shapes with <Morph icon={...} />. */
export const icons = {
  ArrowBendUpLeft: LReply,
  ArrowClockwise: LRotateCw,
  ArrowCounterClockwise: LRotateCcw,
  ArrowDown: LArrowDown,
  ArrowLeft: LArrowLeft,
  ArrowRight: LArrowRight,
  ArrowSquareOut: LExternalLink,
  ArrowUp: LArrowUp,
  ArrowsIn: LMinimize2,
  ArrowsLeftRight: LArrowLeftRight,
  ArrowsOut: LMaximize2,
  Backspace: LDelete,
  Bell: LBell,
  BellSlash: LBellOff,
  BookOpen: LBookOpen,
  BookOpenText: LBookOpenText,
  BookmarkSimple: LBookmark,
  Books: LLibrary,
  Browser: LAppWindow,
  Camera: LCamera,
  CameraRotate: LSwitchCamera,
  CaretDown: LChevronDown,
  CaretLeft: LChevronLeft,
  CaretRight: LChevronRight,
  CaretUp: LChevronUp,
  CaretUpDown: LChevronsUpDown,
  ChatCircle: LMessageCircle,
  ChatCircleDots: LMessageCircleMore,
  ChatCircleText: LMessageSquareText,
  ChatsCircle: LMessagesSquare,
  Check: LCheck,
  CheckCircle: LCircleCheck,
  CheckSquare: LSquareCheck,
  Clock: LClock,
  ClockCounterClockwise: LHistory,
  CloudArrowUp: LCloudUpload,
  Confetti: LPartyPopper,
  Copy: LCopy,
  Desktop: LMonitor,
  DeviceMobile: LSmartphone,
  DeviceMobileCamera: LScanQrCode,
  DeviceTablet: LTablet,
  DotsSixVertical: LGripVertical,
  DotsThree: LEllipsis,
  DotsThreeVertical: LEllipsisVertical,
  DownloadSimple: LDownload,
  EnvelopeSimple: LMail,
  Eye: LEye,
  EyeSlash: LEyeOff,
  FilePdf: LFileDown,
  FileText: LFileText,
  Fire: LFlame,
  FolderPlus: LFolderPlus,
  FolderSimple: LFolder,
  ForkKnife: LUtensils,
  Function: LSquareFunction,
  GearSix: LSettings,
  HandWaving: LHand,
  Heart: LHeart,
  House: LHouse,
  HouseLine: LHouseHeart,
  Image: LImage,
  ImageSquare: LImage,
  Images: LImages,
  Info: LInfo,
  Lightbulb: LLightbulb,
  LinkBreak: LUnlink,
  List: LMenu,
  ListBullets: LList,
  ListDashes: LListMinus,
  ListNumbers: LListOrdered,
  Lock: LLock,
  LockKey: LLockKeyhole,
  LockOpen: LLockOpen,
  MagnifyingGlass: LSearch,
  MagnifyingGlassMinus: LZoomOut,
  MagnifyingGlassPlus: LZoomIn,
  MapPin: LMapPin,
  MathOperations: LCalculator,
  Microphone: LMic,
  MicrophoneSlash: LMicOff,
  Minus: LMinus,
  Moon: LMoon,
  NotePencil: LSquarePen,
  PaperPlaneRight: LSendHorizontal,
  PaperPlaneTilt: LSend,
  Paperclip: LPaperclip,
  Password: LKeyRound,
  Pause: LPause,
  PawPrint: LPawPrint,
  PencilSimple: LPencil,
  PencilSimpleLine: LPencilLine,
  Phone: LPhone,
  PhoneDisconnect: LPhoneOff,
  Play: LPlay,
  Plugs: LPlug,
  Plus: LPlus,
  Prohibit: LBan,
  PushPin: LPin,
  QrCode: LQrCode,
  ShareNetwork: LShare2,
  ShieldCheck: LShieldCheck,
  ShieldStar: LShieldUser,
  ShieldWarning: LShieldAlert,
  SidebarSimple: LPanelLeft,
  SignOut: LLogOut,
  SkipForward: LSkipForward,
  Smiley: LSmile,
  Sparkle: LSparkles,
  Sun: LSun,
  TextAlignLeft: LTextAlignStart,
  Ticket: LTicket,
  Trash: LTrash2,
  UploadSimple: LUpload,
  UserCircleGear: LUserCog,
  UserCirclePlus: LUserPlus,
  UsersThree: LUsers,
  VideoCamera: LVideo,
  VideoCameraSlash: LVideoOff,
  Warning: LTriangleAlert,
  WarningCircle: LCircleAlert,
  Waveform: LAudioLines,
  X: LX,
  XCircle: LCircleX,
} as const;

type Data = MorphIconProps["icon"];

function make(data: Data, name: string): Icon {
  function IconComponent({ size = 20, weight = "regular", "aria-label": label, ...rest }: IconProps) {
    return <MorphIcon icon={data} size={size} strokeWidth={STROKE[weight]} reducedMotion="user" label={label} {...rest} />;
  }
  IconComponent.displayName = name;
  return IconComponent;
}

/** An icon that morphs whenever `icon` changes, e.g. sun to moon. */
export function Morph({ icon, size = 20, weight = "regular", "aria-label": label, ...rest }: IconProps & { icon: Data }) {
  return <MorphIcon icon={icon} size={size} strokeWidth={STROKE[weight]} spring="smooth" reducedMotion="user" label={label} {...rest} />;
}

export const ArrowBendUpLeft = make(LReply, "ArrowBendUpLeft");
export const ArrowClockwise = make(LRotateCw, "ArrowClockwise");
export const ArrowCounterClockwise = make(LRotateCcw, "ArrowCounterClockwise");
export const ArrowDown = make(LArrowDown, "ArrowDown");
export const ArrowLeft = make(LArrowLeft, "ArrowLeft");
export const ArrowRight = make(LArrowRight, "ArrowRight");
export const ArrowSquareOut = make(LExternalLink, "ArrowSquareOut");
export const ArrowUp = make(LArrowUp, "ArrowUp");
export const ArrowsIn = make(LMinimize2, "ArrowsIn");
export const ArrowsLeftRight = make(LArrowLeftRight, "ArrowsLeftRight");
export const ArrowsOut = make(LMaximize2, "ArrowsOut");
export const Backspace = make(LDelete, "Backspace");
export const Bell = make(LBell, "Bell");
export const BellSlash = make(LBellOff, "BellSlash");
export const BookOpen = make(LBookOpen, "BookOpen");
export const BookOpenText = make(LBookOpenText, "BookOpenText");
export const BookmarkSimple = make(LBookmark, "BookmarkSimple");
export const Books = make(LLibrary, "Books");
export const Browser = make(LAppWindow, "Browser");
export const Camera = make(LCamera, "Camera");
export const CameraRotate = make(LSwitchCamera, "CameraRotate");
export const CaretDown = make(LChevronDown, "CaretDown");
export const CaretLeft = make(LChevronLeft, "CaretLeft");
export const CaretRight = make(LChevronRight, "CaretRight");
export const CaretUp = make(LChevronUp, "CaretUp");
export const CaretUpDown = make(LChevronsUpDown, "CaretUpDown");
export const ChatCircle = make(LMessageCircle, "ChatCircle");
export const ChatCircleDots = make(LMessageCircleMore, "ChatCircleDots");
export const ChatCircleText = make(LMessageSquareText, "ChatCircleText");
export const ChatsCircle = make(LMessagesSquare, "ChatsCircle");
export const Check = make(LCheck, "Check");
export const CheckCircle = make(LCircleCheck, "CheckCircle");
export const CheckSquare = make(LSquareCheck, "CheckSquare");
export const Clock = make(LClock, "Clock");
export const ClockCounterClockwise = make(LHistory, "ClockCounterClockwise");
export const CloudArrowUp = make(LCloudUpload, "CloudArrowUp");
export const Confetti = make(LPartyPopper, "Confetti");
export const Copy = make(LCopy, "Copy");
export const Desktop = make(LMonitor, "Desktop");
export const DeviceMobile = make(LSmartphone, "DeviceMobile");
export const DeviceMobileCamera = make(LScanQrCode, "DeviceMobileCamera");
export const DeviceTablet = make(LTablet, "DeviceTablet");
export const DotsSixVertical = make(LGripVertical, "DotsSixVertical");
export const DotsThree = make(LEllipsis, "DotsThree");
export const DotsThreeVertical = make(LEllipsisVertical, "DotsThreeVertical");
export const DownloadSimple = make(LDownload, "DownloadSimple");
export const EnvelopeSimple = make(LMail, "EnvelopeSimple");
export const Eye = make(LEye, "Eye");
export const EyeSlash = make(LEyeOff, "EyeSlash");
export const FilePdf = make(LFileDown, "FilePdf");
export const FileText = make(LFileText, "FileText");
export const Fire = make(LFlame, "Fire");
export const FolderPlus = make(LFolderPlus, "FolderPlus");
export const FolderSimple = make(LFolder, "FolderSimple");
export const ForkKnife = make(LUtensils, "ForkKnife");
export const Function = make(LSquareFunction, "Function");
export const GearSix = make(LSettings, "GearSix");
export const HandWaving = make(LHand, "HandWaving");
export const Heart = make(LHeart, "Heart");
export const House = make(LHouse, "House");
export const HouseLine = make(LHouseHeart, "HouseLine");
export const Image = make(LImage, "Image");
export const ImageSquare = make(LImage, "ImageSquare");
export const Images = make(LImages, "Images");
export const Info = make(LInfo, "Info");
export const Lightbulb = make(LLightbulb, "Lightbulb");
export const LinkBreak = make(LUnlink, "LinkBreak");
export const List = make(LMenu, "List");
export const ListBullets = make(LList, "ListBullets");
export const ListDashes = make(LListMinus, "ListDashes");
export const ListNumbers = make(LListOrdered, "ListNumbers");
export const Lock = make(LLock, "Lock");
export const LockKey = make(LLockKeyhole, "LockKey");
export const LockOpen = make(LLockOpen, "LockOpen");
export const MagnifyingGlass = make(LSearch, "MagnifyingGlass");
export const MagnifyingGlassMinus = make(LZoomOut, "MagnifyingGlassMinus");
export const MagnifyingGlassPlus = make(LZoomIn, "MagnifyingGlassPlus");
export const MapPin = make(LMapPin, "MapPin");
export const MathOperations = make(LCalculator, "MathOperations");
export const Microphone = make(LMic, "Microphone");
export const MicrophoneSlash = make(LMicOff, "MicrophoneSlash");
export const Minus = make(LMinus, "Minus");
export const Moon = make(LMoon, "Moon");
export const NotePencil = make(LSquarePen, "NotePencil");
export const PaperPlaneRight = make(LSendHorizontal, "PaperPlaneRight");
export const PaperPlaneTilt = make(LSend, "PaperPlaneTilt");
export const Paperclip = make(LPaperclip, "Paperclip");
export const Password = make(LKeyRound, "Password");
export const Pause = make(LPause, "Pause");
export const PawPrint = make(LPawPrint, "PawPrint");
export const PencilSimple = make(LPencil, "PencilSimple");
export const PencilSimpleLine = make(LPencilLine, "PencilSimpleLine");
export const Phone = make(LPhone, "Phone");
export const PhoneDisconnect = make(LPhoneOff, "PhoneDisconnect");
export const Play = make(LPlay, "Play");
export const Plugs = make(LPlug, "Plugs");
export const Plus = make(LPlus, "Plus");
export const Prohibit = make(LBan, "Prohibit");
export const PushPin = make(LPin, "PushPin");
export const QrCode = make(LQrCode, "QrCode");
export const ShareNetwork = make(LShare2, "ShareNetwork");
export const ShieldCheck = make(LShieldCheck, "ShieldCheck");
export const ShieldStar = make(LShieldUser, "ShieldStar");
export const ShieldWarning = make(LShieldAlert, "ShieldWarning");
export const SidebarSimple = make(LPanelLeft, "SidebarSimple");
export const SignOut = make(LLogOut, "SignOut");
export const SkipForward = make(LSkipForward, "SkipForward");
export const Smiley = make(LSmile, "Smiley");
export const Sparkle = make(LSparkles, "Sparkle");
export const Sun = make(LSun, "Sun");
export const TextAlignLeft = make(LTextAlignStart, "TextAlignLeft");
export const Ticket = make(LTicket, "Ticket");
export const Trash = make(LTrash2, "Trash");
export const UploadSimple = make(LUpload, "UploadSimple");
export const UserCircleGear = make(LUserCog, "UserCircleGear");
export const UserCirclePlus = make(LUserPlus, "UserCirclePlus");
export const UsersThree = make(LUsers, "UsersThree");
export const VideoCamera = make(LVideo, "VideoCamera");
export const VideoCameraSlash = make(LVideoOff, "VideoCameraSlash");
export const Warning = make(LTriangleAlert, "Warning");
export const WarningCircle = make(LCircleAlert, "WarningCircle");
export const Waveform = make(LAudioLines, "Waveform");
export const X = make(LX, "X");
export const XCircle = make(LCircleX, "XCircle");
