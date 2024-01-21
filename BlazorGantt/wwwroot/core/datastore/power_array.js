var utils = require("../../utils/utils");

var $powerArray = {
  $create: function $create(array) {
    return utils.mixin(array || [], this);
  },
  //remove element at specified position
  $removeAt: function $removeAt(pos, len) {
    if (pos >= 0) this.splice(pos, len || 1);
  },
  //find element in collection and remove it
  $remove: function $remove(value) {
    this.$removeAt(this.$find(value));
  },
  //add element to collection at specific position
  $insertAt: function $insertAt(data, pos) {
    if (!pos && pos !== 0) //add to the end by default
      this.push(data);else {
      var b = this.splice(pos, this.length - pos);
      this[pos] = data;
      this.push.apply(this, b); //reconstruct array without loosing this pointer
    }
  },
  //return index of element, -1 if it doesn't exists
  $find: function $find(data) {
    for (var i = 0; i < this.length; i++) {
      if (data == this[i]) return i;
    }

    return -1;
  },
  //execute some method for each element of array
  $each: function $each(functor, master) {
    for (var i = 0; i < this.length; i++) {
      functor.call(master || this, this[i]);
    }
  },
  //create new array from source, by using results of functor
  $map: function $map(functor, master) {
    for (var i = 0; i < this.length; i++) {
      this[i] = functor.call(master || this, this[i]);
    }

    return this;
  },
  $filter: function $filter(functor, master) {
    for (var i = 0; i < this.length; i++) {
      if (!functor.call(master || this, this[i])) {
        this.splice(i, 1);
        i--;
      }
    }

    return this;
  }
};
module.exports = $powerArray;