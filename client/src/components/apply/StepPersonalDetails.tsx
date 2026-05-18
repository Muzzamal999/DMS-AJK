import { type UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AJK_DISTRICTS = [
  "Muzaffarabad", "Mirpur", "Rawalakot", "Bagh", "Kotli",
  "Neelum", "Haveli", "Hattian", "Jhelum Valley", "Sudhnuti",
];

interface StepPersonalDetailsProps {
  form: UseFormReturn<any>;
}

export function StepPersonalDetails({ form }: StepPersonalDetailsProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-xl font-bold border-b pb-2">Personal Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name (as per CNIC)</FormLabel>
              <FormControl><Input data-testid="input-fullName" placeholder="Enter your full name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fatherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Father / Husband Name</FormLabel>
              <FormControl><Input data-testid="input-fatherName" placeholder="Name of father or husband" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cnic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNIC Number</FormLabel>
              <FormControl><Input data-testid="input-cnic" placeholder="XXXXX-XXXXXXX-X" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl><Input data-testid="input-dob" type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-gender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District of Origin</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-district"><SelectValue placeholder="Select District" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AJK_DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
