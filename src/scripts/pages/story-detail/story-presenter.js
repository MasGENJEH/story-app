import { storyMapper } from '../../data/api-mapper';

export default class StoryDetailPresenter {
  #storyId;
  #view;
  #apiModel;
  #dbModel;

  constructor(storyId, { view, apiModel, dbModel }) {
    this.#storyId = storyId;
    this.#view = view;
    this.#apiModel = apiModel;
    this.#dbModel = dbModel;
  }

  async showStoryDetailMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showStoryDetailMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showStoryDetail() {
    this.#view.showStoryDetailLoading();
    try {
      const response = await this.#apiModel.getStoryById(this.#storyId);

      if (!response.ok) {
        console.error('showStoryDetailAndMap: response:', response);
        this.#view.populateStoryDetailError(response.message);
        return;
      }
      const story = await storyMapper(response.story);
      console.log(story); // for debugging purpose, remove after checking it
      this.#view.populateStoryDetailAndInitialMap(response.message, story);
    } catch (error) {
      console.error('showStoryDetailAndMap: error:', error);
      this.#view.populateStoryDetailError(error.message);
    } finally {
      this.#view.hideStoryDetailLoading();
    }
  }

  // async getCommentsList() {
  //   this.#view.showCommentsLoading();
  //   try {
  //     const response = await this.#apiModel.getAllCommentsByStoryId(this.#storyId);
  //     this.#view.populateStoryDetailComments(response.message, response.story);
  //   } catch (error) {
  //     console.error('getCommentsList: error:', error);
  //     this.#view.populateCommentsListError(error.message);
  //   } finally {
  //     this.#view.hideCommentsLoading();
  //   }
  // }

  // async postNewComment({ body }) {
  //   this.#view.showSubmitLoadingButton();
  //   try {
  //     const response = await this.#apiModel.storeNewCommentByStoryId(this.#storyId, { body });

  //     if (!response.ok) {
  //       console.error('postNewComment: response:', response);
  //       this.#view.postNewCommentFailed(response.message);
  //       return;
  //     }

  //     this.#view.postNewCommentSuccessfully(response.message, response.story);
  //   } catch (error) {
  //     console.error('postNewComment: error:', error);
  //     this.#view.postNewCommentFailed(error.message);
  //   } finally {
  //     this.#view.hideSubmitLoadingButton();
  //   }
  // }

  async saveStory() {
    try {
      const response = await this.#apiModel.getStoryById(this.#storyId);
      const story = await this.#apiModel.getStoryById(this.#storyId);
      await this.#dbModel.putStory(response.story);
      this.#view.saveToBookmarkSuccessfully('Success to save to bookmark');
    } catch (error) {
      console.error('saveStory: error:', error);
      this.#view.saveToBookmarkFailed(error.message);
    }
  }

  showSaveButton() {
    if (this.#isStorySaved()) {
      this.#view.renderRemoveButton();
      return;
    }

    this.#view.renderSaveButton();
  }

  #isStorySaved() {
    return false;
  }
}
