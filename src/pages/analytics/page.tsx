import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartColumn, Clock3, Sparkles } from "lucide-react";
import { usePageTitle } from "@/hooks/page-title";

const previewBars = ["h-12", "h-20", "h-16", "h-28", "h-24", "h-36", "h-32"];

export default function AnalyticsPage() {
  usePageTitle("Analytics");

  return (
    <main className="min-h-[calc(100vh-3rem)] w-full bg-gray-50 px-6 py-8 text-gray-800 md:px-10 md:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <Clock3 className="size-3.5" />
              Coming soon
            </Badge>
          </div>
          <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            See how Iris is helping you move your job search forward.
          </p>
        </header>

        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardContent className="grid gap-8 p-6 md:grid-cols-[1fr_280px] md:p-8">
            <div className="flex flex-col justify-center">
              <div className="mb-5 grid size-11 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <ChartColumn className="size-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                A clearer view of your progress is on the way
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600">
                Soon you’ll be able to track applications, response rates, and
                the momentum behind your search in one place.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-purple-700">
                <Sparkles className="size-4" />
                We’re building something useful
              </div>
            </div>

            <div
              aria-label="Analytics preview"
              className="flex h-52 items-end justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-5 pb-5 pt-8"
            >
              {previewBars.map((height, index) => (
                <div
                  key={height}
                  className={`w-full rounded-t-md ${height} ${
                    index === previewBars.length - 1
                      ? "bg-purple-600"
                      : "bg-purple-200"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Applications", "Track your activity"],
            ["Responses", "Spot what’s working"],
            ["Momentum", "Keep moving forward"],
          ].map(([title, description]) => (
            <Card key={title} className="border-gray-200 shadow-none">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
