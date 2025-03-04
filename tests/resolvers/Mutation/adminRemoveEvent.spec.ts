import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { User, Organization, Event } from "../../../src/models";
import { MutationAdminRemoveEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { adminRemoveEvent as adminRemoveEventResolver } from "../../../src/resolvers/Mutation/adminRemoveEvent";
import {
  EVENT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { TestUserType, TestOrganizationType } from "../../helpers/userAndOrg";
import { TestEventType, createTestEvent } from "../../helpers/events";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestEvent();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  testEvent = resultsArray[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> adminRemoveEvent", () => {
  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      const args: MutationAdminRemoveEventArgs = {
        eventId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === event.organization
  for event with _id === args.eventId`, async () => {
    try {
      await Event.updateOne(
        {
          _id: testEvent?._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      await Event.updateOne(
        {
          _id: testEvent?._id,
        },
        {
          $set: {
            organization: testOrganization?._id,
          },
        }
      );

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organization with _id === event.organization for event with _id === args.eventId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });

  it(`removes event with _id === args.eventId and returns it`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          admins: testUser?._id,
        },
      }
    );

    const args: MutationAdminRemoveEventArgs = {
      eventId: testEvent?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const adminRemoveEventPayload = await adminRemoveEventResolver?.(
      {},
      args,
      context
    );

    expect(adminRemoveEventPayload).toEqual(testEvent?.toObject());

    const testUpdatedUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["createdEvents", "eventAdmin", "registeredEvents"])
      .lean();

    expect(testUpdatedUser).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([]),
        eventAdmin: expect.arrayContaining([]),
        registeredEvents: expect.arrayContaining([]),
      })
    );
  });
});
