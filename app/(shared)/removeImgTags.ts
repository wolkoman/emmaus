export function removeImageTags(input: string) {
  // Regular expression to match <img> tags with any attributes
  const imgTagRegex = /<img\b[^>]*>/gi;
  return input.replace(imgTagRegex, "");
}
