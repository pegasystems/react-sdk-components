import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import useGenAICoachObj from '../../../hooks/useGenAICoachObj';
import type { GenAICoachContentProps } from '../../designSystemExtension/GenAICoachContent/GenAICoach.types';
import type { PConnProps } from '../../../types/PConnProps';

import type { GenAICoach as GenAICoachConfig } from './GenAICoach.types';

interface GenAICoachProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  coaches?: GenAICoachConfig[];
}

export default function GenAICoach(props: GenAICoachProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const GenAICoachContent = getComponentFromMap('GenAICoachContent');

  const { getPConnect, coaches = [] } = props;

  let contextID = '';
  const dataContent = getPConnect().getValue(PCore.getConstants().DATA_INFO.DATA_INFO_CONTENT);
  if (getPConnect().getCaseSummary().ID) {
    contextID = getPConnect().getValue(PCore.getConstants().CASE_INFO.CASE_INFO_ID);
  } else if (dataContent) {
    contextID = `${dataContent.pxObjClass} ${dataContent.pyGUID}`;
  } else {
    const classID = getPConnect().getValue('pyPortal.classID');
    const viewName = getPConnect().getCurrentView();
    contextID = `${classID}!PAGE!${viewName}`.toUpperCase();
  }
  const genAICoachObj = useGenAICoachObj(coaches, contextID, getPConnect());
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
      salutation,
      disclaimerMessage,
      guidedMode,
      actions,
      conversationHistory,
      onLayoutChange,
      onAddAttachment,
      attachments,
      attachmentsError,
      toastMessage,
      onToastClose
    }: Partial<GenAICoachContentProps> = genAICoachObj;

    return (
      <GenAICoachContent
        loading={loading}
        messages={messages}
        coachOptions={coachOptions}
        onCoachChange={onCoachChange}
        onSend={onSend}
        onOpen={onOpen}
        error={error}
        salutation={salutation}
        disclaimerMessage={disclaimerMessage}
        initialSuggestedMessages={initialSuggestedMessages}
        suggestions={suggestions}
        variant={{ placement: 'fullpage' }}
        guidedMode={guidedMode}
        actions={actions}
        conversationHistory={conversationHistory}
        onLayoutChange={onLayoutChange}
        onAddAttachment={onAddAttachment}
        attachments={attachments}
        attachmentsError={attachmentsError}
        toastMessage={toastMessage}
        onToastClose={onToastClose}
      />
    );
  }
  return null;
}
