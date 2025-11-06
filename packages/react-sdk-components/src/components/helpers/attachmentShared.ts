const megabyteSize = 1048576;

export const validateMaxSize = (fileObj: Record<string, number>, maxSizeInMB: string) => {
  const fileSize = (fileObj.size / megabyteSize).toFixed(2);
  return parseFloat(fileSize) < parseFloat(maxSizeInMB);
};
