import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    status: 'idle' | 'confirming' | 'exporting' | 'success' | 'error'
    onConfirm: () => void
    itemCount?: number
    itemType?: 'projects' | 'creators'
    errorMessage?: string
}

export function ExportDialog({
    open,
    onOpenChange,
    status,
    onConfirm,
    itemCount,
    itemType = 'projects',
    errorMessage
}: ExportDialogProps) {
    const handleClose = () => {
        if (status !== 'exporting') {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                {status === 'confirming' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Export to Excel</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                            <p>Exporting data may take a few minutes depending on the number of results.</p>
                            <p className="font-medium text-foreground">
                                Please do NOT close or reload this tab until the download completes.
                            </p>
                            <p>Click Continue to start the export.</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={onConfirm}>
                                Continue
                            </Button>
                        </div>
                    </>
                )}

                {status === 'exporting' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Exporting {itemType}...</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center py-6">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-center font-medium text-foreground">
                                Processing your export...
                            </p>
                            <p className="text-center text-sm mt-2 text-muted-foreground">
                                This may take a few moments. Please wait.
                            </p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Export Complete!</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center py-6">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                            <p className="text-center font-medium text-foreground">
                                Successfully exported {itemCount?.toLocaleString()} {itemType}!
                            </p>
                            <p className="text-center text-sm mt-2 text-muted-foreground">
                                Your download should start automatically.
                            </p>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={handleClose}>
                                Close
                            </Button>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Export Failed</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center py-6">
                            <XCircle className="h-12 w-12 text-destructive mb-4" />
                            <p className="text-center font-medium text-foreground">
                                Failed to export {itemType}
                            </p>
                            <p className="text-center text-sm mt-2 text-muted-foreground">
                                {errorMessage || 'An error occurred. Please try again.'}
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={handleClose}>
                                Close
                            </Button>
                            <Button onClick={onConfirm}>
                                Try Again
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
