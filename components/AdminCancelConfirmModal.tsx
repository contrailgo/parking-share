"use client";

export default function AdminCancelConfirmModal({
  date,
  spotNumber,
  onClose,
  onConfirm,
}: {
  date: string;
  spotNumber: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {spotNumber}번 자리 취소
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {date} 날짜의 등록/신청을 취소하시겠습니까? 관리자 권한으로
          비밀번호 확인 없이 바로 취소됩니다.
        </p>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            아니오
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
          >
            취소하기
          </button>
        </div>
      </div>
    </div>
  );
}
