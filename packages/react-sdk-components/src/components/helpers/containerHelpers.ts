// eslint-disable-next-line import/prefer-default-export
export const isContainerInitialized = pConnect => {
  const context = pConnect.getContextName();
  const containerName = pConnect.getContainerName();
  return PCore.getContainerUtils().isContainerInitialized(context, containerName);
};
