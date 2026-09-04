import { recordAnalytics } from "../../../../src/lib/analytics-server";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return recordAnalytics(request, "undertango");
}
