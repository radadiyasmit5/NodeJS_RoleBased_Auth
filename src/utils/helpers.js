export const objectConstructor = (...props) => {
  const obj = {};
  props.forEach((ele) => {
    obj[ele] = ele;
  });
  return obj;
};

function isNullOrUndefined(value) {
  return value === null || value === undefined;
}
