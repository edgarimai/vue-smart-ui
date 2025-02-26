import BaseAccordion from './components/BaseAccordion.vue';
import BaseAccordionItem from './components/BaseAccordionItem.vue';
import BaseButton from './components/BaseButton.vue';
import BaseDropdown from './components/BaseDropdown.vue';
import BaseInfiniteScroll from './components/BaseInfiniteScroll.vue';
import BaseInput from './components/BaseInput.vue';
import BasePopup from './components/BasePopup.vue';
import BaseSkeleton from './components/BaseSkeleton.vue';
import BaseToast from './components/BaseToast.vue';
import BaseToastContainer from './components/BaseToastContainer.vue';

export default {
  install(app) {
    app.component('BaseAccordion', BaseAccordion);
    app.component('BaseAccordionItem', BaseAccordionItem);
    app.component('BaseButton', BaseButton);
    app.component('BaseDropdown', BaseDropdown);
    app.component('BaseInfiniteScroll', BaseInfiniteScroll);
    app.component('BaseInput', BaseInput);
    app.component('BasePopup', BasePopup);
    app.component('BaseSkeleton', BaseSkeleton);
    app.component('BaseToast', BaseToast);
    app.component('BaseToastContainer', BaseToastContainer);
  },
};

export {
  BaseAccordion,
  BaseAccordionItem,
  BaseButton,
  BaseDropdown,
  BaseInfiniteScroll,
  BaseInput,
  BasePopup,
  BaseSkeleton,
  BaseToast,
  BaseToastContainer,
};
