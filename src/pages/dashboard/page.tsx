import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  OctagonAlert,
} from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";

import CoverLetterDialog from "@/components/custom/CoverLetterDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/page-title";
import { queryKeys } from "@/querykeyfactory";
import {
  fetchAllJobApplications,
  type JobApplication,
} from "@/services/job";
import {
  fetchCoverLetters,
  type CoverLetterListItem,
} from "@/services/coverletter";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

const SUCCESSFUL_LIMIT = 5;
const STATUS_LIMIT = 10;
const COVER_LETTER_LIMIT = 10;

type ApplicationStatus = Extract<
  JobApplication["status"],
  "applied" | "blocked" | "halted"
>;

const statusConfig: Record<
  ApplicationStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  applied: {
    label: "Applied",
    icon: CheckCircle2,
    className: "border-green-200 bg-green-50 text-green-700",
  },
  blocked: {
    label: "Needs attention",
    icon: AlertCircle,
    className: "border-pink-200 bg-pink-50 text-pink-700",
  },
  halted: {
    label: "Halted",
    icon: OctagonAlert,
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
};

function formatApplicationDate(application: JobApplication): string {
  return dayjs(application.appliedAt ?? application.createdAt).fromNow();
}

function ApplicationRow({ application }: { application: JobApplication }) {
  const status = application.status as ApplicationStatus;
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="group relative flex items-start gap-3 border-b border-border py-4 last:border-b-0 hover:bg-muted/50">
      <a
        href={application.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${application.jobTitle} at ${application.companyName}`}
        className="absolute inset-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="truncate font-semibold text-foreground transition-colors group-hover:text-purple-600">
            {application.jobTitle}
          </span>
          <span className="shrink-0 text-sm text-muted-foreground">
            {formatApplicationDate(application)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-foreground">
          {application.companyName}
        </p>
      </div>
      <div className="relative z-10 shrink-0">
        <Badge variant="outline" className={cn("gap-1", config.className)}>
          <StatusIcon className="size-3.5" />
          {config.label}
        </Badge>
      </div>
    </div>
  );
}

function LoadingRows({ count }: { count: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 py-4"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

function ApplicationSection({
  title,
  description,
  applications,
  total,
  loading,
  error,
  limit,
  emptyMessage,
  showViewMore,
}: {
  title: string;
  description: string;
  applications: JobApplication[];
  total: number;
  loading: boolean;
  error: boolean;
  limit: number;
  emptyMessage: string;
  showViewMore: boolean;
}) {
  return (
    <Card className="border-gray-200 shadow-none">
      <CardHeader className="border-b border-gray-100 px-5 py-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="px-5 py-0">
        {loading ? (
          <LoadingRows count={Math.min(limit, 5)} />
        ) : error ? (
          <p className="py-8 text-sm text-red-600">
            Unable to load applications.
          </p>
        ) : applications.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div>
            {applications.map((application) => (
              <ApplicationRow key={application.id} application={application} />
            ))}
          </div>
        )}
        {showViewMore && !loading && !error && total > limit && (
          <Link
            to="/applications"
            className="relative z-10 flex items-center justify-end gap-1 border-t border-gray-100 py-3 text-sm font-medium text-purple-700 hover:text-purple-900"
          >
            View more <ArrowRight className="size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function CoverLetterRow({
  coverLetter,
  onOpen,
}: {
  coverLetter: CoverLetterListItem;
  onOpen: (id: string) => void;
}) {
  const isReady = coverLetter.status === "ready";

  return (
    <div className="group flex items-start gap-3 border-b border-border py-4 last:border-b-0 hover:bg-muted/50">
      <button
        type="button"
        onClick={() => onOpen(coverLetter.id)}
        className="min-w-0 flex-1 text-left"
        disabled={!isReady}
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="truncate font-semibold text-foreground transition-colors group-hover:text-purple-600">
            {coverLetter.jobTitle}
          </span>
          <span className="shrink-0 text-sm text-muted-foreground">
            {dayjs(coverLetter.createdAt).fromNow()}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-foreground">
          {coverLetter.companyName}
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
          {coverLetter.coverLetterPreview ||
            (coverLetter.status === "processing"
              ? "This cover letter is still being generated."
              : "No cover letter content available.")}
        </p>
      </button>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 gap-1",
          isReady
            ? "border-green-200 bg-green-50 text-green-700"
            : coverLetter.status === "processing"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-red-200 bg-red-50 text-red-700",
        )}
      >
        {coverLetter.status === "processing" && (
          <Loader2 className="size-3.5 animate-spin" />
        )}
        {coverLetter.status === "ready" ? "Ready" : coverLetter.status}
      </Badge>
    </div>
  );
}

function CoverLettersSection({
  coverLetters,
  loading,
  error,
  onOpen,
}: {
  coverLetters: CoverLetterListItem[];
  loading: boolean;
  error: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <Card className="border-gray-200 shadow-none md:col-span-2">
      <CardHeader className="border-b border-gray-100 px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileText className="size-4 text-purple-700" />
          Cover letters
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your latest generated cover letters.
        </p>
      </CardHeader>
      <CardContent className="px-5 py-0">
        {loading ? (
          <LoadingRows count={4} />
        ) : error ? (
          <p className="py-8 text-sm text-red-600">
            Unable to load cover letters.
          </p>
        ) : coverLetters.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            No cover letters yet.
          </p>
        ) : (
          coverLetters.map((coverLetter) => (
            <CoverLetterRow
              key={coverLetter.id}
              coverLetter={coverLetter}
              onOpen={onOpen}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  usePageTitle("Overview");
  const [coverLetterId, setCoverLetterId] = useState<string | null>(null);

  const successfulApplicationsQuery = useQuery({
    queryKey: queryKeys.jobApplication.list({
      page: 1,
      limit: SUCCESSFUL_LIMIT,
      status: "applied",
    }),
    queryFn: () =>
      fetchAllJobApplications(1, SUCCESSFUL_LIMIT, undefined, "applied"),
  });
  const blockedApplicationsQuery = useQuery({
    queryKey: queryKeys.jobApplication.list({
      page: 1,
      limit: STATUS_LIMIT,
      status: "blocked",
    }),
    queryFn: () =>
      fetchAllJobApplications(1, STATUS_LIMIT, undefined, "blocked"),
  });
  const haltedApplicationsQuery = useQuery({
    queryKey: queryKeys.jobApplication.list({
      page: 1,
      limit: STATUS_LIMIT,
      status: "halted",
    }),
    queryFn: () =>
      fetchAllJobApplications(1, STATUS_LIMIT, undefined, "halted"),
  });
  const coverLettersQuery = useQuery({
    queryKey: queryKeys.coverLetter.list({
      page: 1,
      limit: COVER_LETTER_LIMIT,
    }),
    queryFn: () => fetchCoverLetters(1, COVER_LETTER_LIMIT),
  });

  return (
    <>
      <main className="min-h-[calc(100vh-3rem)] w-full bg-gray-50 px-6 py-8 text-gray-800 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-5xl">
          <header>
            <h1 className="text-2xl font-extrabold tracking-tight">Overview</h1>
            <p className="mt-1 text-sm text-gray-600">
              Your job search workspace, all in one place.
            </p>
          </header>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ApplicationSection
              title="Successful applications"
              description="Your five most recent applications."
              applications={successfulApplicationsQuery.data?.data ?? []}
              total={successfulApplicationsQuery.data?.total ?? 0}
              loading={successfulApplicationsQuery.isLoading}
              error={successfulApplicationsQuery.isError}
              limit={SUCCESSFUL_LIMIT}
              emptyMessage="No successful applications yet."
              showViewMore={false}
            />
            <ApplicationSection
              title="Needs your attention"
              description="Applications paused while waiting for you."
              applications={blockedApplicationsQuery.data?.data ?? []}
              total={blockedApplicationsQuery.data?.total ?? 0}
              loading={blockedApplicationsQuery.isLoading}
              error={blockedApplicationsQuery.isError}
              limit={STATUS_LIMIT}
              emptyMessage="Nothing needs your attention."
              showViewMore
            />
            <ApplicationSection
              title="Halted applications"
              description="Applications Iris could not complete truthfully."
              applications={haltedApplicationsQuery.data?.data ?? []}
              total={haltedApplicationsQuery.data?.total ?? 0}
              loading={haltedApplicationsQuery.isLoading}
              error={haltedApplicationsQuery.isError}
              limit={STATUS_LIMIT}
              emptyMessage="No halted applications."
              showViewMore
            />
            <CoverLettersSection
              coverLetters={coverLettersQuery.data?.data ?? []}
              loading={coverLettersQuery.isLoading}
              error={coverLettersQuery.isError}
              onOpen={setCoverLetterId}
            />
          </div>
        </div>
      </main>
      <CoverLetterDialog
        open={!!coverLetterId}
        onOpenChange={(open) => {
          if (!open) setCoverLetterId(null);
        }}
        coverLetterId={coverLetterId}
      />
    </>
  );
}
