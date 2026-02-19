import CustomJobDialog from "@/components/custom/CustomJobDialog";
import { Button } from "@/components/ui/button";
import { applyToJob, type jobApplicationSchema } from "@/services/job";
import { Send, Upload } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { toast } from "@/hooks/toast";

export default function Home() {
  const [isCustomJobDialogOpen, setIsCustomJobDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleCustomJobDialogOpenChange = (open: boolean) => {
    setIsCustomJobDialogOpen(open);
  };
  const handleCustomJobDialogSubmit = async (
    data: z.infer<typeof jobApplicationSchema>,
  ) => {
    try {
      setIsLoading(true);
      await applyToJob(data);
      toast.success("Job application initiated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply to job");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div className="bg-gray-50 text-gray-800 w-screen h-screen px-10 py-10">
        <header>
          <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance">
            Apply To Custom Job
          </h1>
          <p className="text-sm text-gray-600">
            Use this tool to upload your resume and quickly apply to a custom
            job with the help of AI automation.
          </p>
          <div className="flex gap-2 mt-4">
            <Button className="hover:opacity-80 cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
            <Button
              onClick={() => setIsCustomJobDialogOpen(true)}
              className="hover:opacity-80 cursor-pointer"
            >
              <Send className="w-4 h-4 mr-2" />
              Apply to Custom Job
            </Button>
          </div>
        </header>
        <hr className="text-gray-300 mt-5" />
      </div>
      <CustomJobDialog
        open={isCustomJobDialogOpen}
        onOpenChange={handleCustomJobDialogOpenChange}
        onSubmit={handleCustomJobDialogSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
