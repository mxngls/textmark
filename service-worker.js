// Introduction:
// Upon selecting text the current selection should be marked in a light
// yellowish tone and a small icon appear. Upon pressing the icon the
// current selection together with related meta data should be saved to
// a local file on the user's computer.
//
// Notes:
// * Maybe instead of just the selection itself it might be good to grab
//   related text as well. One possible and quite easy way would be to
//   grab the inner text of the element from which a user selected a
//   subset.
//   * Sanitze HTML (DOMPurify or other tools)
//
//
// Metadata Specification:
// - The URL where the current textmark can be found.
// - The current date
