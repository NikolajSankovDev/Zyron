"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/actions/user";

interface DeleteAccountButtonProps {
  userEmail?: string | null;
}

export default function DeleteAccountButton({ userEmail }: DeleteAccountButtonProps) {
  const t = useTranslations("account");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();

      if (result?.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.replace("/");
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-red-800 text-red-200 hover:bg-red-900/30"
      >
        {t("deleteAccountButton")}
      </Button>

      <Dialog open={open} onOpenChange={(value) => !isPending && setOpen(value)}>
        <DialogContent className="bg-gray-900 border border-red-900/60 text-white">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              {t("deleteAccountConfirmTitle")}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t("deleteAccountConfirmBody")}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-red-900/80 bg-red-900/20 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              size="sm"
              className="border-gray-700 text-gray-200 hover:bg-gray-800"
            >
              {t("deleteAccountBack")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              size="sm"
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleteAccountProcessing")}
                </>
              ) : (
                t("deleteAccountConfirmAction")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
