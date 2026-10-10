/** A disposition covers exact repositories, never every future model from an author. */
export const reviewedCandidate = (repos, reviewedRepos) => repos.length > 0 && repos.every(repo => reviewedRepos.has(repo));
