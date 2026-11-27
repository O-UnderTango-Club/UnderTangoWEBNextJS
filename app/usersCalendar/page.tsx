import { publicCalendarDay } from "../../src/lib/public-calendar";
import PublicCalendar from "./calendar";

export const dynamic = "force-dynamic";

export default function UsersCalendarPage() {
  return <PublicCalendar todayKey={publicCalendarDay()} />;
}
