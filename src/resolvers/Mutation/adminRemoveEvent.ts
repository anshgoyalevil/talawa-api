import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import { User, Organization, Event } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
} from "../../constants";
/**
 * This function enables an admin to remove a event
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the event exists
 * 2. If the organization exists
 * 3. If the user exists
 * 4. If the user is an admin of organization
 * @returns Deleted event
 */
export const adminRemoveEvent: MutationResolvers["adminRemoveEvent"] = async (
  _parent,
  args,
  context
) => {
  const event = await Event.findOne({
    _id: args.eventId,
  }).lean();

  // Checks whether event exists.
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: event.organization,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether currentUser is an admin of organization.
  await adminCheck(currentUser._id, organization);

  /*
  Removes event._id from eventAdmin, createdEvents and registeredEvents lists on
  currentUser document.
  */
  await User.updateOne(
    {
      _id: currentUser._id,
    },
    {
      $pull: {
        eventAdmin: event._id,
        createdEvents: event._id,
        registeredEvents: event._id,
      },
    }
  );

  // Deletes the event.
  await Event.deleteOne({
    _id: event._id,
  });

  // Returns the deleted event.
  return event;
};
