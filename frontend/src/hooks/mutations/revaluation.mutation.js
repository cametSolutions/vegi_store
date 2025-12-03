import { revaluationServices } from "@/api/services/revaluation.service";
import { toast } from "sonner";

export const revaluationMutations = {
  triggerRevaluation: (queryClient) => ({
    mutationFn: () => revaluationServices.triggerRevaluation(),
    onSuccess: (response) => {
    //   queryClient.invalidateQueries({ queryKey: ["pricelevel"] });
      toast.success("Revaluation triggered successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Error triggering revaluation.");
    },
  }),

};
