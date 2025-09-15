import { useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useDialogContext } from "../context/DialogContext";
import * as bridgeApi from "../api/bridgeApi";
import type { IAsset, ITask, IPersonWorkload } from "../context/AppContext";

/**
 * Asset削除ハンドラ（子Task/PersonWorkload数をダイアログに表示）
 * tasks, personWorkloadsは親コンポーネントから渡す
 */
export function useDeleteAsset({ tasks, personWorkloads }: {
  tasks: ITask[];
  personWorkloads: IPersonWorkload[];
}) {
  const { deleteAsset } = useAppContext();
  const { openDialog } = useDialogContext();

  const handleDeleteAsset = useCallback(
    (asset: IAsset) => {
      const childTasks = tasks.filter((t) => t.asset.id === asset.id);
      const childPersonWorkloads = personWorkloads.filter((pw) =>
        childTasks.some((t) => t.id === pw.task.id)
      );
      openDialog({
        title: "Delete Asset",
        message: `Asset '${asset.name}' と ${childTasks.length}件のTask, ${childPersonWorkloads.length}件のPersonWorkloadを削除します。よろしいですか？`,
        okText: "削除",
        cancelText: "キャンセル",
        onOk: async () => {
          deleteAsset(asset.id); // UIから即削除
          const ok = await bridgeApi.deleteEntity("Asset", asset.id);
          if (!ok) {
            openDialog({
              title: "削除失敗",
              message: "データベースからの削除に失敗しました。",
              okText: "閉じる",
            });
          }
        },
      });
    },
    [tasks, personWorkloads, deleteAsset, openDialog]
  );

  return { handleDeleteAsset };
}
