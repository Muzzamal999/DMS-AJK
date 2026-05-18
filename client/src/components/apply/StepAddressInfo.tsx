import { type UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface StepAddressInfoProps {
  form: UseFormReturn<any>;
  sameAsCurrent: boolean;
}

export function StepAddressInfo({ form, sameAsCurrent }: StepAddressInfoProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-xl font-bold border-b pb-2">Address Information</h2>
      <FormField
        control={form.control}
        name="currentAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current Residential Address</FormLabel>
            <FormControl>
              <Textarea
                data-testid="input-currentAddress"
                className="min-h-[100px]"
                placeholder="Street, Sector, City, District"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sameAsCurrent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                data-testid="checkbox-sameAddress"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Permanent address is same as current address</FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="permanentAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Permanent Address (as on CNIC)</FormLabel>
            <FormControl>
              <Textarea
                data-testid="input-permanentAddress"
                className="min-h-[100px]"
                placeholder="As mentioned on CNIC"
                disabled={sameAsCurrent}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
