var utils = require("../../utils/utils");

var createLinksStoreFacade = function createLinksStoreFacade() {
  return {
    getLinkCount: function getLinkCount() {
      return this.$data.linksStore.count();
    },
    getLink: function getLink(id) {
      return this.$data.linksStore.getItem(id);
    },
    getLinks: function getLinks() {
      return this.$data.linksStore.getItems();
    },
    isLinkExists: function isLinkExists(id) {
      return this.$data.linksStore.exists(id);
    },
    addLink: function addLink(link) {
      var newLink = this.$data.linksStore.addItem(link); // GS-1222. Update fullOrder otherwise the link won't appear after render

      if (this.$data.linksStore.isSilent()) {
        this.$data.linksStore.fullOrder.push(newLink);
      }

      return newLink;
    },
    updateLink: function updateLink(id, data) {
      if (!utils.defined(data)) data = this.getLink(id);
      this.$data.linksStore.updateItem(id, data);
    },
    deleteLink: function deleteLink(id) {
      return this.$data.linksStore.removeItem(id);
    },
    changeLinkId: function changeLinkId(oldid, newid) {
      return this.$data.linksStore.changeId(oldid, newid);
    }
  };
};

module.exports = createLinksStoreFacade;