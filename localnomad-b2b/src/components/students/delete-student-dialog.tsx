'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteStudentDialogProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteStudentDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
}: DeleteStudentDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '삭제에 실패했습니다.');
      }

      toast.success('학생이 삭제되었습니다.');
      onOpenChange(false);
      router.push('/students');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : '삭제에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>학생 삭제</DialogTitle>
          <DialogDescription>
            {studentName} 학생을 삭제하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
