import { useContext } from 'react';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import VerticalSplitOutlinedIcon from '@mui/icons-material/VerticalSplitOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import useGenAICoachObj from '../../../hooks/useGenAICoachObj';
import PortalAgentContext from '../../helpers/PortalAgentContext';
import type { ActionsProps, GenAICoachContentProps } from '../../designSystemExtension/GenAICoachContent/GenAICoach.types';
import type { PConnProps } from '../../../types/PConnProps';

import type { GenAICoach as GenAICoachConfig } from './GenAICoach.types';

interface GenAICoachProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  coaches?: GenAICoachConfig[];
  isPortalAgent?: boolean;
}

export default function GenAICoach(props: GenAICoachProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const GenAICoachContent = getComponentFromMap('GenAICoachContent');
  const PortalAgentSplitView = getComponentFromMap('PortalAgentSplitView');

  const { getPConnect, coaches = [], isPortalAgent = false } = props;
  const { agentExpanded, onAgentToggle, onAgentClick, pagePanel, showAgentPanel } = useContext(PortalAgentContext);

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  // The agent experience is supported on the Infinity runtime only; isInfinityRuntime() is not in the 4.1 typings.
  const isInfinityRuntime = !!(PCore.getEnvironmentInfo() as any).isInfinityRuntime?.();

  let contextID = '';
  const dataContent = getPConnect().getValue(PCore.getConstants().DATA_INFO.DATA_INFO_CONTENT);

  if (getPConnect().getCaseSummary().ID) {
    contextID = getPConnect().getValue(PCore.getConstants().CASE_INFO.CASE_INFO_ID);
  } else if (dataContent) {
    contextID = getPConnect().getValue('dataInfo.contextKey');
  } else {
    let classID = getPConnect().getValue('pyPortal.classID') ?? '';
    const viewName = getPConnect().getCurrentView();

    const isNamespaceEnabled = PCore.isNamespaceEnabled();

    if (isNamespaceEnabled && classID) {
      const namespaces: string[] = (PCore.getEnvironmentInfo()?.getFeatureMap() as any)?.namespaceList ?? [];
      const matchingNs = namespaces.find(ns => classID.startsWith(`${ns}__`));

      if (matchingNs) {
        const nsPrefix = `${matchingNs}__`;
        classID = classID.slice(nsPrefix.length);
      }
    }

    contextID = isPortalAgent ? classID.toUpperCase() : `${classID}!PAGE!${viewName}`.toUpperCase();
  }

  const genAICoachObj = useGenAICoachObj(isInfinityRuntime ? coaches : undefined, contextID, getPConnect(), false, false);

  if (genAICoachObj) {
    const {
      loading,
      messages,
      coachOptions,
      onCoachChange,
      onSend,
      onOpen,
      initialSuggestedMessages,
      suggestions,
      error,
      guidedMode,
      actions,
      conversationHistory,
      onLayoutChange,
      onAddAttachment,
      attachments,
      attachmentsError,
      draftMessage,
      conversationError,
      onStop,
      salutation,
      isCreatingConversation,
      onNewChat,
      questionnaireData,
      onQuestionnaireDismiss
    }: Partial<GenAICoachContentProps> = genAICoachObj;

    const agentActions: ActionsProps | undefined = isPortalAgent
      ? {
          items: [
            ...(actions?.items ?? []),
            {
              id: 'toggle',
              text: agentExpanded ? localizedVal('Split width', localeCategory) : localizedVal('Full width', localeCategory),
              visual: agentExpanded ? <VerticalSplitOutlinedIcon fontSize='small' /> : <OpenInFullIcon fontSize='small' />,
              onClick: () => onAgentToggle()
            },
            {
              id: 'minimize',
              text: localizedVal('Hide', localeCategory),
              visual: <VisibilityOffOutlinedIcon fontSize='small' />,
              onClick: () => onAgentClick()
            }
          ]
        }
      : actions;

    const coachElement = (
      <GenAICoachContent
        loading={loading}
        messages={messages}
        coachOptions={coachOptions}
        onCoachChange={onCoachChange}
        onSend={onSend}
        onOpen={onOpen}
        error={error}
        initialSuggestedMessages={initialSuggestedMessages}
        suggestions={suggestions}
        variant={{ placement: 'fullpage' }}
        guidedMode={guidedMode}
        actions={agentActions}
        conversationHistory={conversationHistory}
        onLayoutChange={onLayoutChange}
        onAddAttachment={onAddAttachment}
        attachments={attachments}
        attachmentsError={attachmentsError}
        salutation={salutation}
        allowFullScreen={!isPortalAgent}
        isPortalAgent={isPortalAgent}
        pagePanel={pagePanel}
        draftMessage={draftMessage}
        conversationError={conversationError}
        onStop={onStop}
        isCreatingConversation={isCreatingConversation}
        onNewChat={onNewChat}
        questionnaireData={questionnaireData}
        onQuestionnaireDismiss={onQuestionnaireDismiss}
      />
    );

    if (isPortalAgent && pagePanel) {
      return (
        <PortalAgentSplitView pagePanel={pagePanel} showAgentPanel={showAgentPanel} agentExpanded={agentExpanded}>
          {coachElement}
        </PortalAgentSplitView>
      );
    }

    return coachElement;
  }

  return null;
}
