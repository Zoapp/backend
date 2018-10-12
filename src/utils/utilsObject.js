/**
 * remove object undefined fields.
 * @param {*} object
 */
function deleteUndefined(object) {
  const obj = { ...object };
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
  return obj;
}

export default deleteUndefined;
