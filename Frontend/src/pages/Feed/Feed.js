import React, { Component, Fragment } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false,
    postsPerPage: 2,
  };

  componentDidMount() {
    const graphqlQuery = {
      query: `
        query {
          user {
            status
          }
        }
      `,
    };

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {        
        return res.json();
      })
      .then(resData => {
        if (resData.erros) {
          throw new Error(
            "Fetching status failed!"
          );
        }
        this.setState({ status: resData.data.user.status });
      })
      .catch(this.catchError);

    this.loadPosts();    
  }  

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }

    const graphqlQuery = {
      query: `
        query ShowPosts($page: Int!) {                
          showPosts(page: $page) {            
            posts {
              _id
              title
              content
              imageUrl
              creator {
                name
              }
            }
            totalPosts            
          }
        }
      `,
      variables: {
        page
      }
    }

    fetch(`http://localhost:8080/graphql?page=${page}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        console.log(resData.posts);

        if (resData.erros) {
          throw new Error(
            "Fetching posts failed!"
          );
        }

        this.setState({
          posts: resData.data.showPosts.posts.map(post => {
            return {
              ...post, 
              imagePath: post.imageUrl
            };
          }),
          totalPosts: resData.data.showPosts.totalPosts,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {
    event.preventDefault();

    const graphqlQuery = {
      query: `
        mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) {
            status
          }
        }
      `,
      variables: {
        status: this.state.status
      }
    };

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {        
        return res.json();
      })
      .then(resData => {
        console.log(resData);
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });

    const formData = new FormData();
    formData.append('image', postData.image);

    if(this.state.editPost) {
      formData.append('oldPath', this.state.editPost.imagePath);
    }
    
    fetch('http://localhost:8080/post-image', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + this.props.token
      },
      body: formData
    })
    .then(res => res.json())
    .then(resData => {
      console.log(resData);
      
      const imageUrl = resData.imagePath || this.state.editPost.imagePath;
      
      let graphqlQuery = {
        query: `
          mutation CreatePost($postInput: PostInputData!) {
            createPost(postInput: $postInput) {
              _id
              title
              content
              imageUrl
              creator {
                name
              }
              createdAt
            }
          }
        `,
        variables: {
          postInput: {
            title: postData.title,
            content: postData.content,
            imageUrl
          }
        }
      };    

      if(this.state.editPost) {        
        const postId = this.state.editPost._id.toString();
        
        graphqlQuery = {
          query: `
            mutation UpdatePost($postInput: PostInputData!, $postId: ID!) {
              updatePost(postInput: $postInput, postId: $postId) {
                _id
                title
                content
                imageUrl
                creator {
                  name
                }
                createdAt
              }
            }
          `,
          variables: {
            postInput: {
              title: postData.title,
              content: postData.content,
              imageUrl
            },
            postId
          }
        };
      }
       
      return fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + this.props.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery),
      });
    })
    .then(res => res.json())
    .then(resData => {
      if (resData.erros && resData.errors[0].status === 422) {
        throw new Error(
          "Invalid input"
        );
      }
      if (resData.erros && resData.errors[0].status === 401) {
        throw new Error(
          "Not authenticated"
        );
      }
      if (resData.erros) {
        throw new Error(
          "Post creation failed!"
        );
      }
      console.log(resData);   
      
      let mutation = 'createPost';
      if(this.state.editPost) {
        mutation = 'updatePost';
      }
      const post = {
        _id: resData.data[mutation]._id,
        title: resData.data[mutation].title,
        content: resData.data[mutation].content,
        creator: resData.data[mutation].creator,
        createdAt: resData.data[mutation].createdAt,
        imagePath: resData.data[mutation].imageUrl,
      }

      this.setState(prevState => {
        let updatedPosts = [...prevState.posts];
        let updatedTotalPosts = prevState.totalPosts;
        if (prevState.editPost) {
          const postIndex = prevState.posts.findIndex(
            p => p._id === prevState.editPost._id
          );
          updatedPosts[postIndex] = post;
        } else {
          updatedTotalPosts++;
          if (prevState.posts.length >= 2) {
            updatedPosts.pop();
          }
          updatedPosts.unshift(post);
        }
        return {
          posts: updatedPosts,
          isEditing: false,
          editPost: null,
          editLoading: false,
          totalPosts: updatedTotalPosts
        };
      });
    })
    .catch(err => {
      console.log(err);
      this.setState({
        isEditing: false,
        editPost: null,
        editLoading: false,
        error: err
      });
    });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });

    const graphqlQuery = {
      query: `
            mutation DeletePost($postId: ID!) {
              deletePost(postId: $postId)
            }
          `,
      variables: {        
        postId
      }
    };
    console.log('zzzzzzzzzzz');
    
    fetch(`http://localhost:8080/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {        
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        if (resData.erros && resData.errors[0].status === 403) {
          throw new Error(
            "Not Authorized"
          );
        }
        if (resData.erros && resData.errors[0].status === 401) {
          throw new Error(
            "Not authenticated"
          );
        }
        if (resData.erros && resData.errors[0].status === 404) {
          throw new Error(
            "No post found"
          );
        }
        if (resData.erros) {
          throw new Error(
            "Post Deletion failed!"
          );
        }
        this.loadPosts();
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / this.state.postsPerPage)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
