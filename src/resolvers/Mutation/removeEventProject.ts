import { User, EventProject } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_PROJECT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
/**
 * This function enables to remove an event project.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the event project exists
 * 3. If the user is the creator of the event project.
 * @returns Deleted event project.
 */
export const removeEventProject = async (
  _parent: any,
  args: any,
  context: any
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks if currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const eventProject = await EventProject.findOne({
    _id: args.id,
  }).lean();

  // Checks whether eventProject exists.
  if (!eventProject) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_PROJECT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_PROJECT_NOT_FOUND_ERROR.CODE,
      EVENT_PROJECT_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is not the creator of eventProject.
  if (!eventProject.creator.equals(context.userId)) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  await EventProject.deleteOne({
    _id: args.id,
  });

  return eventProject;
};
