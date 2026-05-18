import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { applicationApi } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FormStepper } from "@/components/apply/FormStepper";
import { StepPersonalDetails } from "@/components/apply/StepPersonalDetails";
import { StepAddressInfo } from "@/components/apply/StepAddressInfo";
import { StepDocuments } from "@/components/apply/StepDocuments";
import { StepReview } from "@/components/apply/StepReview";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronRight, ChevronLeft, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const applySchema = z.object({
  fullName:         z.string().min(2, "Full name is required"),
  fatherName:       z.string().min(2, "Father's name is required"),
  cnic:             z.string().min(13, "Valid CNIC is required"),
  dateOfBirth:      z.string().min(1, "Date of birth is required"),
  gender:           z.enum(["male", "female", "other"]),
  district:         z.string().min(1, "District is required"),
  currentAddress:   z.string().min(10, "Current address is required"),
  permanentAddress: z.string().min(10, "Permanent address is required"),
  sameAsCurrent:    z.boolean().optional(),
});

type ApplyFormValues = z.infer<typeof applySchema>;

const STEP_FIELDS: Record<number, (keyof ApplyFormValues)[]> = {
  1: ["fullName", "fatherName", "cnic", "dateOfBirth", "gender", "district"],
  2: ["currentAddress", "permanentAddress"],
};

export default function Apply() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const uploadedFilesRef = useRef<Record<string, File>>({});
  const draftAppIdRef = useRef<string | null>(null);

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      fullName: "", fatherName: "", cnic: "", dateOfBirth: "",
      gender: "male", district: "", currentAddress: "", permanentAddress: "",
      sameAsCurrent: false,
    },
  });

  const watchSameAsCurrent = form.watch("sameAsCurrent");
  const watchCurrentAddress = form.watch("currentAddress");

  useEffect(() => {
    if (watchSameAsCurrent) {
      form.setValue("permanentAddress", watchCurrentAddress);
    }
  }, [watchSameAsCurrent, watchCurrentAddress, form]);

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields ? await form.trigger(fields) : true;
    if (valid) setStep((s) => Math.min(4, s + 1));
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setIsSavingDraft(true);
    try {
      const data = form.getValues();
      const formData = new FormData();
      if (draftAppIdRef.current) formData.append("applicationId", draftAppIdRef.current);
      formData.append("fullName", data.fullName || "");
      formData.append("fatherName", data.fatherName || "");
      formData.append("cnic", data.cnic || "");
      formData.append("dateOfBirth", data.dateOfBirth || "");
      formData.append("gender", data.gender || "");
      formData.append("district", data.district || "");
      formData.append("currentAddress", data.currentAddress || "");
      formData.append("permanentAddress", data.permanentAddress || "");

      const res = await applicationApi.saveDraft(formData);
      draftAppIdRef.current = res.application.applicationId;
      toast.success("Draft saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!user) return;

    // Validate all required fields before submitting
    const valid = await form.trigger([
      "fullName", "fatherName", "cnic", "dateOfBirth", "gender", "district",
      "currentAddress", "permanentAddress"
    ]);

    if (!valid) {
      toast.error("Please fill in all required fields.");
      // Navigate to the first step with invalid fields
      const errors = form.formState.errors;
      if (errors.fullName || errors.fatherName || errors.cnic || errors.dateOfBirth || errors.gender || errors.district) {
        setStep(1);
      } else if (errors.currentAddress || errors.permanentAddress) {
        setStep(2);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const data = form.getValues();
      const submitFormData = new FormData();
      submitFormData.append("fullName", data.fullName);
      submitFormData.append("fatherName", data.fatherName);
      submitFormData.append("cnic", data.cnic);
      submitFormData.append("dateOfBirth", data.dateOfBirth);
      submitFormData.append("gender", data.gender);
      submitFormData.append("district", data.district);
      submitFormData.append("currentAddress", data.currentAddress);
      submitFormData.append("permanentAddress", data.permanentAddress);

      // Append uploaded documents
      const files = uploadedFilesRef.current;
      Object.entries(files).forEach(([key, file]) => {
        submitFormData.append(key, file);
      });

      await applicationApi.create(submitFormData);
      toast.success("Application submitted successfully!");
      setLocation("/citizen/applications");
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const values = form.getValues();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">New Domicile Application</h1>
          <p className="text-muted-foreground mt-1">Provide accurate information as per your official documents.</p>
        </div>

        <FormStepper currentStep={step} />

        <Card className="border-border shadow-sm">
          <CardContent className="p-8">
            <Form {...form}>
              <form className="space-y-6">
                {step === 1 && <StepPersonalDetails form={form} />}
                {step === 2 && <StepAddressInfo form={form} sameAsCurrent={!!watchSameAsCurrent} />}
                {step === 3 && (
                  <StepDocuments
                    onFilesChange={(files) => { uploadedFilesRef.current = files; }}
                  />
                )}
                {step === 4 && (
                  <StepReview
                    data={{
                      fullName:         values.fullName,
                      fatherName:       values.fatherName,
                      cnic:             values.cnic,
                      dateOfBirth:      values.dateOfBirth,
                      gender:           values.gender,
                      district:         values.district,
                      currentAddress:   values.currentAddress,
                      permanentAddress: values.permanentAddress,
                    }}
                  />
                )}

                <div className="flex justify-between pt-6 border-t border-border mt-8">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => setLocation("/dashboard")}>
                      Cancel
                    </Button>
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft}
                    >
                      {isSavingDraft ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save as Draft
                    </Button>
                    {step < 4 ? (
                      <Button type="button" onClick={handleNext} className="bg-primary hover:bg-primary/90">
                        Next Step <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleSubmitFinal}
                        className="bg-primary hover:bg-primary/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Submit Application
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}