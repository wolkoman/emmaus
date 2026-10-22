"use client";

import { subscribeToNewsletter } from "@/app/newsletter/newsletter-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";

export function NewsletterSubscribePopover() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const errorMessage = await subscribeToNewsletter(email);

    if (errorMessage) {
      setError(errorMessage);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setEmail("");
    setLoading(false);

    // Close popover after 3 seconds
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
    }, 3000);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">Newsletter abonnieren</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {success ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircledIcon className="h-5 w-5" />
              <h3 className="font-semibold">E-Mail versendet!</h3>
            </div>
            <p className="text-sm text-neutral-600">
              Bitte überprüfen Sie Ihr Postfach und bestätigen Sie die
              Anmeldung.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Newsletter abonnieren</h3>
              <p className="text-sm text-neutral-600">
                Erhalten Sie monatlichen unsere Mitteilungen per E-Mail.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-Mail-Adresse <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ihre-email@beispiel.at"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird gesendet..." : "Bestätigen"}
            </Button>

            <p className="text-xs text-neutral-500">
              Sie erhalten eine Bestätigungsmail, um die Anmeldung
              abzuschließen.
            </p>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
