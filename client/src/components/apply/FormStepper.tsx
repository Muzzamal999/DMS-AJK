import { CheckCircle2 } from "lucide-react";

const STEPS = ["Personal Details", "Address Info", "Documents", "Review"];

interface FormStepperProps {
  currentStep: number;
}

export function FormStepper({ currentStep }: FormStepperProps) {
  return (
    <div className="relative">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 rounded-full" />
      <div
        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-300"
        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
      />
      <div className="relative flex justify-between">
        {STEPS.map((label, index) => {
          const isActive = currentStep === index + 1;
          const isPast = currentStep > index + 1;
          return (
            <div key={label} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-colors z-10 ${
                  isActive || isPast
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                {isPast ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
