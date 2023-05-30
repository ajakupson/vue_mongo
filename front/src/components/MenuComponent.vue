<template>
        <div class="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark">
            <div class="d-flex flex-column align-items-center align-items-sm-start px-3 pt-4 text-white min-vh-100">
                <a href="/" class="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                    <span class="fs-5 d-none d-sm-inline menu-title">Menu</span>
                </a>
                <ul class="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start" id="menu">
                    <li class="nav-item">
                        <a href="/" class="nav-link align-middle px-0">
                            <i class="fa fa-home" aria-hidden="true"></i><span class="ms-1 d-none d-sm-inline">Home</span>
                        </a>
                    </li>
                    <li>
                        <a href="/charts" data-bs-toggle="collapse" class="nav-link px-0 align-middle">
                            <i class="fa fa-area-chart" aria-hidden="true"></i>
                            <span class="ms-1 d-none d-sm-inline">Analytics</span>
                        </a>
                    </li>
                    <li>
                        <a href="/products" data-bs-toggle="collapse" class="nav-link px-0 align-middle">
                            <i class="fa fa-product-hunt" aria-hidden="true"></i>
                            <span class="ms-1 d-none d-sm-inline">Products</span>
                        </a>
                    </li>
                    <li>
                        <a href="/customers" data-bs-toggle="collapse" class="nav-link px-0 align-middle">
                            <i class="fa fa-users" aria-hidden="true"></i>
                            <span class="ms-1 d-none d-sm-inline">Customers</span>
                        </a>
                    </li>
                </ul>
                <hr>
            </div>
        </div>
</template>

<style scoped>
    .menu-title {
        font-weight: bold;
        font-size: 1.2rem;
    }
    ul.nav {
        width: 100%;
    }
    ul.nav li {
        width: 100%;
    }
    a.nav-link {
        color: #ffffff;
        font-weight: bold;
        padding-right: 10px;
    }
    a.nav-link i {
        color: #ffffff;
        margin: 0 10px;
    }
    a.nav-link:hover {
        background-color: gray;
    }
</style>