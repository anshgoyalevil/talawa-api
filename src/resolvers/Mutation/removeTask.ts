import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TASK_NOT_FOUND_ERROR,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Task, Event } from "../../models";
/**
 * This function enables to remove a task.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the task exists
 * 3. If the user is the creator of the task.
 * @returns Deleted task.
 */
export const removeTask: MutationResolvers["removeTask"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const task = await Task.findOne({
    _id: args.id,
  }).lean();

  // Checks whether task exists.
  if (!task) {
    throw new errors.NotFoundError(
      requestContext.translate(TASK_NOT_FOUND_ERROR.MESSAGE),
      TASK_NOT_FOUND_ERROR.CODE,
      TASK_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is not the creator of task.
  if (!task.creator.equals(context.userId)) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Deletes the task.
  await Task.deleteOne({
    _id: task._id,
  });

  // Removes task._id from tasks list of task.event.
  await Event.updateMany(
    {
      _id: task.event,
    },
    {
      $pull: {
        tasks: task._id,
      },
    }
  );

  // Returns deleted task.
  return task;
};
