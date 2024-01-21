module.exports = function (item, view, config) {
  return {
    top: view.getItemTop(item.id),
    height: view.getItemHeight(item.id),
    left: 0,
    right: Infinity
  };
};