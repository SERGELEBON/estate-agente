import { SchoolProfileForm } from "@/components/schools/school-profile-form";

export default function SchoolDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My school</h1>
        <p className="text-sm text-muted-foreground">Complete your profile — students compare schools on these details.</p>
      </div>
      <SchoolProfileForm />
    </div>
  );
}
