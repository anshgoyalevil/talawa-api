import { POST_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Post } from "../../models";
/**
 * This function enables to unlike a post.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the post exists
 * @returns Post.
 */
export const unlikePost: MutationResolvers["unlikePost"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const post = await Post.findOne({
    _id: args.id,
  }).lean();

  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserHasLikedPost = post.likedBy.some((liker) =>
    liker.equals(context.userId)
  );

  if (currentUserHasLikedPost === true) {
    return await Post.findOneAndUpdate(
      {
        _id: post._id,
      },
      {
        $pull: {
          likedBy: context.userId,
        },
        $inc: {
          likeCount: -1,
        },
      },
      {
        new: true,
      }
    ).lean();
  }

  return post;
};
