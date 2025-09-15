import { useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useDialogContext } from "../context/DialogContext";
import * as bridgeApi from "../api/bridgeApi";
import type { IAsset, ITask, IPersonWorkload, IPhase, IMilestoneTask } from "../context/AppContext";
import React from "react";

/**
 * CRUD系のカスタムフック（今後create/edit/deleteなども追加可能）
 */
export function useEntityCrud() {
  const { deleteAsset, deleteTask, deletePhase,deleteMilestoneTask, tasks, personWorkloads, assets, milestoneTasks } = useAppContext();
  const { openDialog } = useDialogContext();

  /**
   * Asset削除ハンドラ（子Task/PersonWorkload数をダイアログに表示）
   * 改行は JSX <br /> を使って表示
   */
  const handleDeleteAsset = useCallback(
    (asset: IAsset) => {
      const childTasks = tasks.filter((t) => t.asset.id === asset.id);
      const childMilestoneTasks = milestoneTasks.filter((mt) => mt.asset.id === asset.id);
      const childPersonWorkloads = personWorkloads.filter((pw) =>
        childTasks.some((t) => t.id === pw.task.id)
      );
      openDialog({
        title: "Delete Asset",
        message: React.createElement(
          React.Fragment,
          null,
          `Are you sure you want to delete asset '${asset.name}'?`,
          React.createElement("br"),
          "The following related entities will also be deleted:",
          React.createElement("br"),
          `- ${childMilestoneTasks.length} Asset Milestone`,
          React.createElement("br"),
          `- ${childTasks.length} Task`,
          React.createElement("br"),
          `- ${childPersonWorkloads.length} Workload`
        ),
        okText: "Delete",
        cancelText: "Cancel",
        onOk: async () => {
            try {
                const res = await bridgeApi.deleteEntity("Asset", asset!.id);
                if (res) {
                  deleteAsset(asset!.id);
                } else {
                  openDialog({
                    title: "Delete Failed",
                    message: `Failed to delete asset '${asset?.name}'.`,
                    okText: "OK",
                  });
                }
            } catch (e) {
                openDialog({
                  title: "Delete Failed",
                  message: `Error occurred: ${e}`,
                  okText: "OK",
                });
              }
        },
      });
    },
    [deleteAsset, openDialog]
  );

   const handleDeleteTask = useCallback(
    (task: ITask) => {
      const childPersonWorkloads = personWorkloads.filter((pw) =>( task.id === pw.task.id)
      );
      openDialog({
        title: "Delete Asset",
        message: React.createElement(
          React.Fragment,
          null,
          `Are you sure you want to delete asset '${task.name}'?`,
          React.createElement("br"),
          "The following related entities will also be deleted:",
            React.createElement("br"),
          `- ${childPersonWorkloads.length} Workload`
        ),
        okText: "Delete",
        cancelText: "Cancel",
        onOk: async () => {
            try {
                const res = await bridgeApi.deleteEntity("Task", task!.id);
                if (res) {
                  deleteTask(task!.id);
                } else {
                  openDialog({
                    title: "Delete Failed",
                    message: `Failed to delete asset '${task?.name}'.`,
                    okText: "OK",
                  });
                }
            } catch (e) {
                openDialog({
                  title: "Delete Failed",
                  message: `Error occurred: ${e}`,
                  okText: "OK",
                });
              }
        },
      });
    },
    [deleteTask, openDialog]
  );

   const handleDeletePhase = useCallback(
    (phase: IPhase) => {
      const childAssets = assets.filter((t) => t.phase.id === phase.id);
      const childTasks = tasks.filter((t) => childAssets.some((a) => a.id === t.asset.id));
      const childMilestoneTasks = milestoneTasks.filter((mt) => childAssets.some((a) => a.id === mt.asset.id));
      const childPersonWorkloads = personWorkloads.filter((pw) =>
        childTasks.some((t) => t.id === pw.task.id)
      );
      openDialog({
        title: "Delete Phase",
        message: React.createElement(
          React.Fragment,
          null,
          `Are you sure you want to delete phase '${phase.name}'?`,
          React.createElement("br"),
          "The following related entities will also be deleted:",
          React.createElement("br"),
          `- ${childAssets.length} Asset`,
          React.createElement("br"),
          `- ${childMilestoneTasks.length} Asset Milestone`,
          React.createElement("br"),
          `- ${childTasks.length} Task`,
          React.createElement("br"),
          `- ${childPersonWorkloads.length} Workload`
        ),
        okText: "Delete",
        cancelText: "Cancel",
        onOk: async () => {
            try {
                const res = await bridgeApi.deleteEntity("Phase", phase!.id);
                if (res) {
                  deletePhase(phase!.id);
                } else {
                  openDialog({
                    title: "Delete Failed",
                    message: `Failed to delete phase '${phase?.name}'.`,
                    okText: "OK",
                  });
                }
            } catch (e) {
                openDialog({
                  title: "Delete Failed",
                  message: `Error occurred: ${e}`,
                  okText: "OK",
                });
              }
        },
      });
    },
    [deleteAsset, openDialog]
  );

  const handleDeleteMilestoneTask = useCallback(
    (milestoneTask: IMilestoneTask) => {
      openDialog({
        title: "Delete Milestone Task",
        message: React.createElement(
          React.Fragment,
          null,
          `Are you sure you want to delete milestone task '${milestoneTask.name}'?`,
        ),
        okText: "Delete",
        cancelText: "Cancel",
        onOk: async () => {
            try {
                const res = await bridgeApi.deleteEntity("MilestoneTask", milestoneTask!.id);
                if (res) {
                  deleteMilestoneTask(milestoneTask!.id);
                } else {
                  openDialog({
                    title: "Delete Failed",
                    message: `Failed to delete milestone task '${milestoneTask?.name}'.`,
                    okText: "OK",
                  });
                }
            } catch (e) {
                openDialog({
                  title: "Delete Failed",
                  message: `Error occurred: ${e}`,
                  okText: "OK",
                });
              }
        },
      });
    },
    [deleteAsset, openDialog]
  );

  // 今後 create/edit なども追加可能

  return {
    handleDeleteAsset,
    handleDeleteTask,
    // handleCreateAsset, handleEditAsset なども追加可能
  };
}
