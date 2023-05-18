// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Persona,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  useArrowNavigationGroup,
} from "@fluentui/react-components";
import {
  BookExclamationMark24Regular,
  CalendarCancel24Regular,
  CheckmarkSquare24Regular,
  DocumentCopyRegular,
  Chat20Regular,
  MoreHorizontal24Filled,
  Status24Regular,
  ShareScreenStop24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import * as microsoftTeams from "@microsoft/teams-js";
import { cancelSentNotification, duplicateDraftNotification } from "../../apis/messageListApi";
import { getBaseUrl } from "../../configVariables";
import { formatNumber } from "../../i18n";
import { ROUTE_PARTS, ROUTE_QUERY_PARAMS } from "../../routes";
import { GetDraftMessagesSilentAction, GetSentMessagesSilentAction } from "../../actions";
import { useAppDispatch } from "../../store";

export const SentMessageDetail = (sentMessages: any) => {
  const { t } = useTranslation();
  const keyboardNavAttr = useArrowNavigationGroup({ axis: "grid" });
  const dispatch = useAppDispatch();
  const statusUrl = (id: string) =>
    getBaseUrl() + `/${ROUTE_PARTS.VIEW_STATUS}/${id}?${ROUTE_QUERY_PARAMS.LOCALE}={locale}`;

  const renderSendingText = (message: any) => {
    var text = "";
    switch (message.status) {
      case "Queued":
        text = t("Queued");
        break;
      case "SyncingRecipients":
        text = t("SyncingRecipients");
        break;
      case "InstallingApp":
        text = t("InstallingApp");
        break;
      case "Sending":
        let sentCount =
          (message.succeeded ? message.succeeded : 0) +
          (message.failed ? message.failed : 0) +
          (message.unknown ? message.unknown : 0);
        text = t("SendingMessages", {
          SentCount: formatNumber(sentCount),
          TotalCount: formatNumber(message.totalMessageCount),
        });
        break;
      case "Canceling":
        text = t("Canceling");
        break;
      case "Canceled":
      case "Sent":
      case "Failed":
        text = "";
    }

    return text;
  };

  const shouldNotShowCancel = (msg: any) => {
    let cancelState = false;
    if (msg !== undefined && msg.status !== undefined) {
      const status = msg.status.toUpperCase();
      cancelState =
        status === "SENT" ||
        status === "UNKNOWN" ||
        status === "FAILED" ||
        status === "CANCELED" ||
        status === "CANCELING";
    }
    return cancelState;
  };

  const onOpenTaskModule = (event: any, url: string, title: string) => {
    let taskInfo: microsoftTeams.TaskInfo = {
      url: url,
      title: title,
      height: microsoftTeams.TaskModuleDimension.Large,
      width: microsoftTeams.TaskModuleDimension.Large,
      fallbackUrl: url,
    };
    let submitHandler = (err: any, result: any) => {};
    microsoftTeams.tasks.startTask(taskInfo, submitHandler);
  };

  const duplicateDraftMessage = async (id: number) => {
    try {
      await duplicateDraftNotification(id);
      GetDraftMessagesSilentAction(dispatch);
    } catch (error) {
      return error;
    }
  };

  const cancelSentMessage = async (id: number) => {
    try {
      await cancelSentNotification(id);
      GetSentMessagesSilentAction(dispatch);
    } catch (error) {
      return error;
    }
  };

  return (
    <Table {...keyboardNavAttr} role="grid" aria-label="Sent messages table with grid keyboard navigation">
      <TableHeader>
        <TableRow>
          <TableHeaderCell key="title">
            <b>{t("TitleText")}</b>
          </TableHeaderCell>
          <TableHeaderCell key="status" aria-hidden="true" />
          <TableHeaderCell key="recipients">
            <b>{t("Recipients")}</b>
          </TableHeaderCell>
          <TableHeaderCell key="sent">
            <b>{t("Sent")}</b>
          </TableHeaderCell>
          <TableHeaderCell key="createdBy">
            <b className="big-screen-visible">{t("CreatedBy")}</b>
          </TableHeaderCell>
          <TableHeaderCell key="actions" style={{ float: "right" }}>
            <b>Actions</b>
          </TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sentMessages!.sentMessages!.map((item: any) => (
          <TableRow key={item.id + "key"}>
            <TableCell tabIndex={0} role="gridcell">
              <TableCellLayout
                media={<Chat20Regular />}
                style={{ cursor: "pointer" }}
                onClick={() => onOpenTaskModule(null, statusUrl(item.id), t("ViewStatus"))}
              >
                {item.title}
              </TableCellLayout>
            </TableCell>
            <TableCell tabIndex={0} role="gridcell">
              <TableCellLayout>
                <span className="big-screen-visible">{renderSendingText(item)}</span>
              </TableCellLayout>
            </TableCell>
            <TableCell tabIndex={0} role="gridcell">
              <TableCellLayout>
                <Tooltip content={t("TooltipSuccess") || ""} relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<CheckmarkSquare24Regular style={{ color: "#22bb33", verticalAlign: "middle" }} />}
                    size="small"
                  ></Button>
                </Tooltip>
                <span style={{ verticalAlign: "middle", paddingLeft: "2px", paddingRight: "8px" }}>
                  {formatNumber(item.succeeded)}
                </span>
                <Tooltip content={t("TooltipFailure") || ""} relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<ShareScreenStop24Regular style={{ color: "#bb2124", verticalAlign: "middle" }} />}
                    size="small"
                  ></Button>
                </Tooltip>
                <span style={{ verticalAlign: "middle", paddingLeft: "2px", paddingRight: "8px" }}>
                  {formatNumber(item.failed)}
                </span>
                {item.canceled && (
                  <>
                    <Tooltip content="Canceled" relationship="label">
                      <Button
                        appearance="subtle"
                        icon={<BookExclamationMark24Regular style={{ color: "#f0ad4e", verticalAlign: "middle" }} />}
                        size="small"
                      ></Button>
                    </Tooltip>
                    <span style={{ verticalAlign: "middle", paddingLeft: "2px", paddingRight: "8px" }}>
                      {formatNumber(item.canceled)}
                    </span>
                  </>
                )}
                {item.unknown && (
                  <>
                    <Tooltip content="Unknown" relationship="label">
                      <Button
                        appearance="subtle"
                        icon={<Warning24Regular style={{ color: "#e9835e", verticalAlign: "middle" }} />}
                        size="small"
                      ></Button>
                    </Tooltip>
                    <span style={{ verticalAlign: "middle", paddingLeft: "2px", paddingRight: "8px" }}>
                      {formatNumber(item.unknown)}
                    </span>
                  </>
                )}
              </TableCellLayout>
            </TableCell>
            <TableCell tabIndex={0} role="gridcell">
              <TableCellLayout>{item.sentDate}</TableCellLayout>
            </TableCell>
            <TableCell tabIndex={0} role="gridcell">
              <TableCellLayout>
                <span className="big-screen-visible">
                  <Persona name={item.createdBy} secondaryText={"Member"} avatar={{ color: "colorful" }} />
                </span>
              </TableCellLayout>
            </TableCell>
            <TableCell role="gridcell">
              <TableCellLayout style={{ float: "right" }}>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button aria-label="Actions menu" icon={<MoreHorizontal24Filled />} />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem
                        icon={<Status24Regular />}
                        key={"viewStatusKey"}
                        onClick={() => onOpenTaskModule(null, statusUrl(item.id), t("ViewStatus"))}
                      >
                        {t("ViewStatus")}
                      </MenuItem>
                      <MenuItem
                        key={"duplicateKey"}
                        icon={<DocumentCopyRegular />}
                        onClick={() => duplicateDraftMessage(item.id)}
                      >
                        {t("Duplicate")}
                      </MenuItem>
                      {!shouldNotShowCancel(item) && (
                        <MenuItem
                          key={"cancelKey"}
                          icon={<CalendarCancel24Regular />}
                          onClick={() => cancelSentMessage(item.id)}
                        >
                          {t("Cancel")}
                        </MenuItem>
                      )}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </TableCellLayout>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
