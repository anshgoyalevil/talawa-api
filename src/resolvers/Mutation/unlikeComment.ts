import { COMMENT_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Comment } from "../../models";
/**
 * This function enables to unlike a comment.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the comment exists
 * @returns Comment.
 */
export const unlikeComment: MutationResolvers["unlikeComment"] = async (
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

  const comment = await Comment.findOne({
    _id: args.id,
  }).lean();

  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_ERROR.MESSAGE),
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserHasLikedComment = comment.likedBy.some((liker) =>
    liker.equals(context.userId)
  );

  if (currentUserHasLikedComment === true) {
    return await Comment.findOneAndUpdate(
      {
        _id: args.id,
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

  return comment;
};
