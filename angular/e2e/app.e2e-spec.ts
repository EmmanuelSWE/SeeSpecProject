import { SeeSpecTemplatePage } from './app.po';

describe('SeeSpec App', function() {
  let page: SeeSpecTemplatePage;

  beforeEach(() => {
    page = new SeeSpecTemplatePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
