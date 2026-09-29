import { COLORS } from '../constants';

// Shared wrapper for the small single-stroke line icons used on both new
// sticker types. One brand-green stroke, no fill — kept deliberately
// simple so ink stays negligible regardless of how many print.
function LineIcon({ children, size = 10, color = COLORS.brand }) {
  return (
    <svg
      width={`${size}mm`}
      height={`${size}mm`}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const DiyaIcon = (props) => (
  <LineIcon {...props}>
    <path d="M4 15c2 2.5 5 3.5 8 3.5s6-1 8-3.5" />
    <path d="M4 15c0-1.6 1.2-2.5 2.5-2 1 .4 1.6 1 3.5 1s2-1.5 2-1.5 .5 1.5 2 1.5 2.5-.6 3.5-1c1.3-.5 2.5.4 2.5 2" />
    <path d="M12 9c-.8-1.2-.8-2.4 0-3.5.8 1.1.8 2.3 0 3.5z" />
  </LineIcon>
);
const ModakIcon = (props) => (
  <LineIcon {...props}>
    <path d="M6 14a6 6 0 0 1 12 0c0 3-2.5 5-6 7-3.5-2-6-4-6-7z" />
    <path d="M8.5 12.5c1-.8 2-1.2 3.5-1.2s2.5.4 3.5 1.2" />
  </LineIcon>
);
const ToranIcon = (props) => (
  <LineIcon {...props}>
    <path d="M3 7c4 3 14 3 18 0" />
    <path d="M7 7v3.5l-1.5 2M12 7v4l-1.5 2M17 7v3.5l1.5 2" />
  </LineIcon>
);
const KiteIcon = (props) => (
  <LineIcon {...props}>
    <path d="M12 3l6 7-6 11-6-11 6-7z" />
    <path d="M6 10h12M3 20l3-3M21 20l-3-3" />
  </LineIcon>
);
const RakhiIcon = (props) => (
  <LineIcon {...props}>
    <circle cx="12" cy="13" r="4" />
    <path d="M12 9V5M9.5 6.5 12 5l2.5 1.5" />
    <path d="M9 12h6M9 14h6" />
  </LineIcon>
);
const HoliIcon = (props) => (
  <LineIcon {...props}>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 5v2.5M12 16.5V19M5 12h2.5M16.5 12H19M7.5 7.5l1.7 1.7M14.8 14.8l1.7 1.7M16.5 7.5l-1.7 1.7M9.2 14.8l-1.7 1.7" />
  </LineIcon>
);
const ChristmasTreeIcon = (props) => (
  <LineIcon {...props}>
    <path d="M12 3l4 5h-2.5l3.5 5h-3l3.5 5H6.5l3.5-5h-3l3.5-5H9l3-5z" />
    <path d="M12 18v3" />
  </LineIcon>
);
const FireworkIcon = (props) => (
  <LineIcon {...props}>
    <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
    <circle cx="12" cy="12" r="2" />
  </LineIcon>
);
export const SparkleIcon = (props) => (
  <LineIcon {...props}>
    <path d="M12 4l1.6 5.4L19 11l-5.4 1.6L12 18l-1.6-5.4L5 11l5.4-1.6L12 4z" />
  </LineIcon>
);

// Curated defaults, matching the Hindi/Kannada catalog audience plus a
// couple of general occasions. A plain config array, not a DB table —
// seasonal content that doesn't need to be editable outside of code, and
// grows by adding an entry here. Each has its own accent color — this
// sticker is low-volume (one per gift box, not per bar), so the ink-cost
// argument that ruled out color on the soap label doesn't apply here, and
// "festive" reads better with real color than brand-green monochrome.
export const OCCASION_PRESETS = [
  { id: 'diwali', label: 'Diwali', message: 'Happy Diwali', Icon: DiyaIcon, color: '#B45309' },
  { id: 'ganesh-chaturthi', label: 'Ganesh Chaturthi', message: 'Happy Ganesh Chaturthi', Icon: ModakIcon, color: '#C2410C' },
  { id: 'ugadi', label: 'Ugadi', message: 'Happy Ugadi', Icon: ToranIcon, color: '#65A30D' },
  { id: 'sankranti', label: 'Sankranti', message: 'Happy Sankranti', Icon: KiteIcon, color: '#EA580C' },
  { id: 'raksha-bandhan', label: 'Raksha Bandhan', message: 'Happy Raksha Bandhan', Icon: RakhiIcon, color: '#B91C1C' },
  { id: 'holi', label: 'Holi', message: 'Happy Holi', Icon: HoliIcon, color: '#C2185B' },
  { id: 'christmas', label: 'Christmas', message: 'Merry Christmas', Icon: ChristmasTreeIcon, color: '#B91C1C' },
  { id: 'new-year', label: 'New Year', message: 'Happy New Year', Icon: FireworkIcon, color: '#B45309' },
];
