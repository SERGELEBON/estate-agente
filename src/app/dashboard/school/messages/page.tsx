import { Messenger } from "@/components/messenger";

export default function SchoolMessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">Questions from prospective students.</p>
      </div>
      <Messenger scope="AGENT" />
    </div>
  );
}
