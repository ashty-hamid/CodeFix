import { defineStore } from "pinia";

export const usePostsStore = defineStore("postsStore", {
  state: () => ({
    posts: [],
    tags: [],
    answers: [],   // <-- answers live here, not inside posts
    votes: [],     // <-- votes for posts
    answerVotes: [] // <-- votes for answers
  }),

  getters: {
    allTags(state) {
      return state.tags;
    },

    postsWithMeta(state) {
      return state.posts.map(p => {
        const postAnswers = state.answers.filter(a => a.postId === p.id);

        const up = state.votes.filter(v => v.postId === p.id && v.value === 1).length;
        const down = state.votes.filter(v => v.postId === p.id && v.value === -1).length;

        return {
          ...p,
          tags: p.tags.map(id => state.tags.find(t => t.id === id)),
          answersCount: postAnswers.length,
          voteScore: up - down,
          author: state.users?.find(u => u.id === p.authorId)
        };
      });
    },

    postById: (state) => (id) => {
      const p = state.posts.find(p => p.id === id);
      if (!p) return null;

      const postAnswers = state.answers
        .filter(a => a.postId === id)
        .map(a => {
          const up = state.answerVotes.filter(v => v.answerId === a.id && v.value === 1).length;
          const down = state.answerVotes.filter(v => v.answerId === a.id && v.value === -1).length;

          return {
            ...a,
            voteScore: up - down,
            author: state.users?.find(u => u.id === a.authorId)
          };
        });

      return {
        ...p,
        tags: p.tags.map(id => state.tags.find(t => t.id === id)),
        answers: postAnswers
      };
    }
  },

  actions: {
    addPost({ title, body, tagNames, authorId }) {
      const id = this.posts.length + 1;

      const tagIds = tagNames.map((name) => {
        let t = this.tags.find((x) => x.name === name);
        if (!t) {
          t = { id: this.tags.length + 1, name };
          this.tags.push(t);
        }
        return t.id;
      });

      this.posts.unshift({
        id,
        title,
        body,
        tags: tagIds,
        authorId,
        createdAt: new Date().toISOString(),
      });

      return id;
    },

    addAnswer({ postId, body, authorId }) {
      const id = this.answers.length + 1;

      this.answers.push({
        id,
        postId,
        body,
        authorId,
        createdAt: new Date().toISOString(),
      });
    },

    votePost({ postId, userId, value }) {
      const ex = this.votes.find(v => v.postId === postId && v.userId === userId);
      if (ex) {
        ex.value = value;
      } else {
        this.votes.push({ postId, userId, value });
      }
    },

    voteAnswer({ answerId, userId, value }) {
      const ex = this.answerVotes.find(v => v.answerId === answerId && v.userId === userId);
      if (ex) {
        ex.value = value;
      } else {
        this.answerVotes.push({ answerId, userId, value });
      }
    }
  }
});
