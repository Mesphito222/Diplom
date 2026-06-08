class BookingModelTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner', password='12345',
            email='owner@test.com', profile_completed=True)
        self.renter = User.objects.create_user(
            username='renter', password='12345',
            email='renter@test.com', profile_completed=True)
        self.item = Item.objects.create(
            title='Drill', price_per_day=1000,
            owner=self.owner, status='available')

    def test_booking_total_price_calculation(self):
        booking = Booking.objects.create(
            item=self.item, renter=self.renter,
            start_date=date(2025, 6, 1),
            end_date=date(2025, 6, 4))
        self.assertEqual(booking.total_price, 3000)

    def test_cannot_book_own_item(self):
        with self.assertRaises(Exception):
            Booking.objects.create(
                item=self.item, renter=self.owner,
                start_date=date(2025, 6, 1),
                end_date=date(2025, 6, 3))

    def test_booking_date_overlap(self):
        Booking.objects.create(
            item=self.item, renter=self.renter,
            start_date=date(2025, 6, 1),
            end_date=date(2025, 6, 5))
        with self.assertRaises(Exception):
            Booking.objects.create(
                item=self.item, renter=self.renter,
                start_date=date(2025, 6, 3),
                end_date=date(2025, 6, 7))
